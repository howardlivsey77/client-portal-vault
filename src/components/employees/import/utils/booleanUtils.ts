
// Parse boolean value from various formats
export const parseBooleanValue = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  
  if (typeof value === 'boolean') return value;
  
  if (typeof value === 'number') return value !== 0;
  
  if (typeof value === 'string') {
    const str = value.toLowerCase().trim();
    return !(
      str === '' || 
      str === 'false' || 
      str === 'no' || 
      str === '0' || 
      str === 'n' ||
      str === 'off' ||
      str === 'inactive'
    );
  }
  
  return Boolean(value);
};
