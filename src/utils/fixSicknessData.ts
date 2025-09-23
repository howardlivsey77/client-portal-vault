import { sicknessDataCorrection } from "@/services/sicknessDataCorrection";

/**
 * One-time script to fix the sickness data issues
 */
export const runSicknessDataFix = async () => {
  console.log('🔧 Starting sickness data correction...');
  
  try {
    const results = await sicknessDataCorrection.fixAllRecords();
    
    console.log('✅ Sickness data correction completed:');
    console.log('- Karen Cross:', results.karen.success ? 'Fixed' : 'Failed');
    console.log('- Klaudia Adamiec:', results.klaudia.success ? 'Fixed' : 'Failed');
    
    return results;
  } catch (error) {
    console.error('❌ Error during sickness data correction:', error);
    throw error;
  }
};

// Run immediately if this file is imported
runSicknessDataFix().then(() => {
  console.log('🎉 All fixes applied successfully!');
}).catch(error => {
  console.error('💥 Fix failed:', error);
});