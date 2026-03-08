import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  activateGalleryImage,
  createGalleryImage,
  deleteGalleryImage,
  getGalleryAdmin,
  uploadGalleryImage,
  updateGalleryImage,
} from "../api/gallery.api";

const emptyImageForm = {
  imageUrl: "",
  thumbnailUrl: "",
  title: "",
  description: "",
  altText: "",
  sortOrder: 0,
  active: true,
};

function normalizeImagePayload(form) {
  return {
    imageUrl: form.imageUrl.trim(),
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    title: form.title.trim() || null,
    description: form.description.trim() || null,
    altText: form.altText.trim() || null,
    sortOrder: Number(form.sortOrder || 0),
    active: Boolean(form.active),
  };
}

export default function GalleryAdmin() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(emptyImageForm);
  const [newImageFile, setNewImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editImage, setEditImage] = useState(emptyImageForm);
  const [editImageFile, setEditImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchImages = useCallback(async () => {
    try {
      const data = await getGalleryAdmin(token);
      setImages(data);
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du chargement de la galerie", "Error while loading gallery"));
    }
  }, [token, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchImages();
  }, [authLoading, token, user, fetchImages]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newImage.imageUrl.trim() && !newImageFile) {
      setMessage(
        tr(
          "Ajoutez une image par URL ou fichier",
          "Provide an image using URL or file upload"
        )
      );
      return;
    }

    try {
      setLoading(true);
      let payload = normalizeImagePayload(newImage);
      if (newImageFile) {
        const uploaded = await uploadGalleryImage(token, newImageFile);
        payload = {
          ...payload,
          imageUrl: uploaded.imageUrl,
          thumbnailUrl: payload.thumbnailUrl || uploaded.thumbnailUrl,
        };
      }

      await createGalleryImage(token, payload);
      setNewImage(emptyImageForm);
      setNewImageFile(null);
      setMessage("");
      fetchImages();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la creation", "Error while creating"));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (image) => {
    setEditingId(image.id);
    setEditImageFile(null);
    setEditImage({
      ...emptyImageForm,
      ...image,
      thumbnailUrl: image.thumbnailUrl ?? "",
      title: image.title ?? "",
      description: image.description ?? "",
      altText: image.altText ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditImageFile(null);
    setEditImage(emptyImageForm);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      let payload = normalizeImagePayload(editImage);
      if (editImageFile) {
        const uploaded = await uploadGalleryImage(token, editImageFile);
        payload = {
          ...payload,
          imageUrl: uploaded.imageUrl,
          thumbnailUrl: payload.thumbnailUrl || uploaded.thumbnailUrl,
        };
      }

      await updateGalleryImage(token, editingId, payload);
      cancelEditing();
      setMessage("");
      fetchImages();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour", "Error while updating"));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (image) => {
    try {
      await activateGalleryImage(token, image.id, !image.active);
      fetchImages();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors du changement de statut", "Error while changing status"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("Supprimer cette image ?", "Delete this image?"))) return;

    try {
      await deleteGalleryImage(token, id);
      fetchImages();
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;

  return (
    <div>
      <h2>{tr("Gestion de la galerie d'accueil", "Homepage gallery management")}</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleCreate}>
        <h3>{tr("Ajouter une image", "Add image")}</h3>
        <input
          placeholder={tr("URL image", "Image URL")}
          value={newImage.imageUrl}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, imageUrl: event.target.value }))
          }
        />
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setNewImageFile(event.target.files?.[0] || null)}
        />
        {newImageFile && (
          <p>{tr("Fichier selectionne", "Selected file")}: {newImageFile.name}</p>
        )}
        <input
          placeholder={tr("URL miniature (optionnel)", "Thumbnail URL (optional)")}
          value={newImage.thumbnailUrl}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
          }
        />
        <input
          placeholder={tr("Titre (optionnel)", "Title (optional)")}
          value={newImage.title}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, title: event.target.value }))
          }
        />
        <input
          placeholder={tr("Description", "Description")}
          value={newImage.description}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, description: event.target.value }))
          }
        />
        <input
          placeholder={tr("Texte alternatif", "Alt text")}
          value={newImage.altText}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, altText: event.target.value }))
          }
        />
        <input
          type="number"
          min="0"
          placeholder={tr("Ordre", "Order")}
          value={newImage.sortOrder}
          onChange={(event) =>
            setNewImage((prev) => ({ ...prev, sortOrder: event.target.value }))
          }
        />
        <label style={{ marginLeft: "8px" }}>
          <input
            type="checkbox"
            checked={newImage.active}
            onChange={(event) =>
            setNewImage((prev) => ({ ...prev, active: event.target.checked }))
          }
          />
          {tr("Active", "Active")}
        </label>
        <button type="submit" disabled={loading}>
          {tr("Ajouter", "Add")}
        </button>
      </form>

      <h3>{tr("Images enregistrees", "Saved images")}</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{tr("Apercu", "Preview")}</th>
            <th>{tr("Titre", "Title")}</th>
            <th>{tr("Description", "Description")}</th>
            <th>{tr("Ordre", "Order")}</th>
            <th>{tr("Actif", "Active")}</th>
            <th>{tr("Actions", "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {images.length === 0 && (
            <tr>
              <td colSpan="7">{tr("Aucune image", "No image")}</td>
            </tr>
          )}
          {images.map((image) => (
            <tr key={image.id}>
              <td>{image.id}</td>
              <td>
                <img
                  src={image.thumbnailUrl || image.imageUrl}
                  alt={image.altText || image.title || `${tr("Image", "Image")} ${image.id}`}
                  style={{ width: "90px", height: "60px", objectFit: "cover" }}
                />
              </td>
              <td>{image.title || "-"}</td>
              <td>{image.description || "-"}</td>
              <td>{image.sortOrder}</td>
              <td>{image.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
              <td>
                <button onClick={() => startEditing(image)}>{tr("Modifier", "Edit")}</button>
                <button onClick={() => handleToggleActive(image)}>
                  {image.active ? tr("Desactiver", "Disable") : tr("Activer", "Enable")}
                </button>
                <button onClick={() => handleDelete(image.id)}>{tr("Supprimer", "Delete")}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingId && (
        <div style={{ marginTop: "16px" }}>
          <h3>{tr("Modifier l'image", "Edit image")} #{editingId}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <input
              placeholder={tr("URL image", "Image URL")}
              value={editImage.imageUrl}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, imageUrl: event.target.value }))
              }
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setEditImageFile(event.target.files?.[0] || null)}
            />
            {editImageFile && (
              <p>{tr("Fichier selectionne", "Selected file")}: {editImageFile.name}</p>
            )}
            <input
              placeholder={tr("URL miniature", "Thumbnail URL")}
              value={editImage.thumbnailUrl}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, thumbnailUrl: event.target.value }))
              }
            />
            <input
              placeholder={tr("Titre", "Title")}
              value={editImage.title}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <input
              placeholder={tr("Description", "Description")}
              value={editImage.description}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <input
              placeholder={tr("Texte alternatif", "Alt text")}
              value={editImage.altText}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, altText: event.target.value }))
              }
            />
            <input
              type="number"
              min="0"
              placeholder={tr("Ordre", "Order")}
              value={editImage.sortOrder}
              onChange={(event) =>
                setEditImage((prev) => ({ ...prev, sortOrder: event.target.value }))
              }
            />
            <label>
              <input
                type="checkbox"
                checked={editImage.active}
                onChange={(event) =>
                setEditImage((prev) => ({ ...prev, active: event.target.checked }))
              }
              />
              {tr("Active", "Active")}
            </label>
          </div>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleUpdate} disabled={loading}>
              {tr("Sauvegarder", "Save")}
            </button>
            <button onClick={cancelEditing}>{tr("Annuler", "Cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
