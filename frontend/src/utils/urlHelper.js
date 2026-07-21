export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000');

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};
