import { useContext } from 'react';
import { HieroContext } from '../providers/HieroProvider';

export function useHiero() {
  const context = useContext(HieroContext);
  
  if (!context) {
    throw new Error('useHiero must be used within a HieroProvider');
  }
  
  return context;
}