import { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '../../components/AdminLayout';
import { adminGalleryAPI } from '../../services/api';
import { getMediaUrl } from '@/utils/media';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newImage, setNewImage] = useState({
    file: null,
    title: '',
    preview: ''
  });

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    return () => {
      if (newImage.preview) {
        URL.revokeObjectURL(newImage.preview);
      }
    };
  }, [newImage.preview]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminGalleryAPI.getGallery();
      const gallery = Array.isArray(response?.data) ? response.data : [];
      setImages(gallery);
    } catch (error) {
      console.error('Erreur:', error);
      setError("Impossible de charger la galerie. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newImage.file) {
      alert("Veuillez sélectionner une image.");
      return;
    }
    try {
      const { data } = await adminGalleryAPI.uploadGalleryPhoto(newImage.file, newImage.title);
      const createdImage = data?.gallery_item;
      if (createdImage) {
        setImages(prev => [createdImage, ...prev]);
      } else {
        await fetchImages();
      }
      setShowModal(false);
      if (newImage.preview) {
        URL.revokeObjectURL(newImage.preview);
      }
      setNewImage({ file: null, title: '', preview: '' });
    } catch (error) {
      console.error('Erreur:', error);
      alert("Erreur lors du téléversement de l'image");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;
    
    try {
      await adminGalleryAPI.deleteImage(id);
      setImages(prev => prev.filter(image => image.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
      alert("Impossible de supprimer cette image");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">Chargement...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion de la Galerie</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une image
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Aucune image dans la galerie</p>
          <Button onClick={() => setShowModal(true)}>
            Ajouter la première image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map(image => (
            <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
              <div className="relative aspect-square">
                <img
                  src={getMediaUrl(image.image_url)}
                  alt={image.title || 'Image galerie'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=Image+non+disponible';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
              {image.title && (
                <div className="p-3">
                  <p className="font-medium text-sm">{image.title}</p>
                  {image.category && (
                    <p className="text-xs text-gray-500 mt-1 capitalize">{image.category}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Ajouter une image</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                <label className="block text-sm font-medium mb-1">Fichier image *</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (newImage.preview) {
                        URL.revokeObjectURL(newImage.preview);
                      }
                      setNewImage({
                        file,
                        title: newImage.title,
                        preview: URL.createObjectURL(file)
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={newImage.title}
                  onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Description de l'image"
                />
              </div>

              {newImage.preview && (
                <div className="border rounded-md p-2">
                  <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                  <img
                    src={newImage.preview}
                    alt="Aperçu"
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newImage.preview) {
                      URL.revokeObjectURL(newImage.preview);
                    }
                    setShowModal(false);
                    setNewImage({ file: null, title: '', preview: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Ajouter
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}

