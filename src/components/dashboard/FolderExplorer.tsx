
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Folder,
  MoreVertical
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderItem[];
}

interface FolderExplorerProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

export function FolderExplorer({ onFolderSelect, selectedFolderId }: FolderExplorerProps) {
  const [folderStructure, setFolderStructure] = useState<FolderItem[]>(() => {
    // Try to load folder structure from localStorage
    const savedFolders = localStorage.getItem('documentFolders');
    if (savedFolders) {
      try {
        return JSON.parse(savedFolders);
      } catch (e) {
        console.error('Error parsing saved folders', e);
      }
    }
    
    // Default folder structure if nothing is saved
    return [
      { id: 'contracts', name: 'Contracts', parentId: null, children: [] },
      { id: 'reports', name: 'Reports', parentId: null, children: [] },
      { id: 'invoices', name: 'Invoices', parentId: null, children: [] }
    ];
  });
  
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  
  // Save folder structure to localStorage whenever it changes
  const updateFolderStructure = (newStructure: FolderItem[]) => {
    setFolderStructure(newStructure);
    localStorage.setItem('documentFolders', JSON.stringify(newStructure));
  };
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Add a new folder to the structure
  const addFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentParentId,
      children: []
    };
    
    // If it's a root level folder
    if (!currentParentId) {
      updateFolderStructure([...folderStructure, newFolder]);
    } else {
      // If it's a subfolder, we need to traverse the structure to find the parent
      const updatedStructure = addSubFolder(folderStructure, currentParentId, newFolder);
      updateFolderStructure(updatedStructure);
      
      // Ensure the parent folder is expanded
      setExpandedFolders(prev => ({
        ...prev,
        [currentParentId]: true
      }));
    }
    
    setNewFolderName("");
    setIsAddingFolder(false);
  };
  
  // Helper function to add a subfolder
  const addSubFolder = (folders: FolderItem[], parentId: string, newFolder: FolderItem): FolderItem[] => {
    return folders.map(folder => {
      if (folder.id === parentId) {
        return {
          ...folder,
          children: [...folder.children, newFolder]
        };
      } else if (folder.children.length > 0) {
        return {
          ...folder,
          children: addSubFolder(folder.children, parentId, newFolder)
        };
      }
      return folder;
    });
  };
  
  // Open dialog to add a new folder
  const openAddFolderDialog = (parentId: string | null = null) => {
    setCurrentParentId(parentId);
    setNewFolderName("");
    setIsAddingFolder(true);
  };
  
  // Get folder name by ID for breadcrumb display
  const getFolderPath = (folderId: string | null): string[] => {
    if (!folderId) return ["All Documents"];
    
    const findPath = (folders: FolderItem[], id: string, path: string[] = []): string[] | null => {
      for (const folder of folders) {
        if (folder.id === id) {
          return [...path, folder.name];
        }
        
        if (folder.children.length > 0) {
          const childPath = findPath(folder.children, id, [...path, folder.name]);
          if (childPath) return childPath;
        }
      }
      return null;
    };
    
    let path: string[] = [];
    for (const rootFolder of folderStructure) {
      if (rootFolder.id === folderId) {
        path = [rootFolder.name];
        break;
      }
      
      const childPath = findPath(rootFolder.children, folderId, [rootFolder.name]);
      if (childPath) {
        path = childPath;
        break;
      }
    }
    
    return path.length > 0 ? path : ["Unknown Folder"];
  };
  
  // Render folder items recursively
  const renderFolderItems = (folders: FolderItem[], level = 0) => {
    return (
      <>
        {folders.map(folder => (
          <div key={folder.id} className="pl-2">
            <div 
              className={`flex items-center py-1 px-1 rounded-md ${selectedFolderId === folder.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 p-0 mr-1" 
                onClick={() => toggleFolder(folder.id)}
              >
                {folder.children.length > 0 ? (
                  expandedFolders[folder.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : (
                  <div className="w-4" />
                )}
              </Button>
              
              <div 
                className="flex flex-1 items-center space-x-2 cursor-pointer" 
                onClick={() => onFolderSelect(folder.id)}
                style={{ paddingLeft: `${level * 4}px` }}
              >
                {selectedFolderId === folder.id ? 
                  <FolderOpen className="h-4 w-4 text-blue-500" /> : 
                  <Folder className="h-4 w-4" />
                }
                <span className="text-sm">{folder.name}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openAddFolderDialog(folder.id)}>
                    Add Subfolder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {expandedFolders[folder.id] && folder.children.length > 0 && (
              <div className="ml-4">
                {renderFolderItems(folder.children, level + 1)}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };
  
  return (
    <div className="border rounded-md p-2 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Folders</h3>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 px-2 text-xs"
          onClick={() => openAddFolderDialog()}
        >
          <FolderPlus className="h-3 w-3 mr-1" />
          New Folder
        </Button>
      </div>
      
      <div className="space-y-1">
        <div 
          className={`flex items-center py-1 px-2 rounded-md ${!selectedFolderId ? 'bg-muted' : 'hover:bg-muted/50'}`}
          onClick={() => onFolderSelect(null)}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          <span className="text-sm">All Documents</span>
        </div>
        
        {renderFolderItems(folderStructure)}
      </div>
      
      {/* Folder breadcrumb */}
      {selectedFolderId && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-4">
          <span>Path:</span>
          {getFolderPath(selectedFolderId).map((name, i, arr) => (
            <span key={i}>
              {name}
              {i < arr.length - 1 && <span className="mx-1">/</span>}
            </span>
          ))}
        </div>
      )}
      
      {/* Add folder dialog */}
      <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {currentParentId 
                ? `Create a subfolder in ${getFolderPath(currentParentId).join(' / ')}` 
                : 'Create a new top-level folder'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input 
              value={newFolderName} 
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={addFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
