import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  activateGalleryImage,
  createGalleryImage,
  deleteGalleryImage,
  getGalleryAdmin,
  setGalleryHomeBackground,
  uploadGalleryImage,
  updateGalleryImage,
} from "../api/gallery.api";
import { ActionIconButton, DeleteIcon, EditIcon, StatusToggle } from "../components/ui/AdminActions";

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
    imageUrl: String(form.imageUrl || "").trim(),
    thumbnailUrl: String(form.thumbnailUrl || "").trim() || null,
    title: String(form.title || "").trim() || null,
    description: String(form.description || "").trim() || null,
    altText: String(form.altText || "").trim() || null,
    sortOrder: Number(form.sortOrder || 0),
    active: Boolean(form.active),
  };
}

function formatFileSize(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ImagePreviewCard({ previewUrl, file, onClear, tr }) {
  if (!previewUrl) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/30">
      <img
        src={previewUrl}
        alt={tr("Apercu image selectionnee", "Selected image preview")}
        className="h-52 w-full object-cover sm:h-64"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-3">
        <p className="truncate text-sm font-semibold text-white">{file?.name || tr("Image", "Image")}</p>
        {file?.size ? <p className="text-xs text-stone-200">{formatFileSize(file.size)}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={tr("Supprimer la selection", "Clear selection")}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/65 text-sm font-bold text-white transition hover:bg-red-700/80"
      >
        x
      </button>
    </div>
  );
}

export default function GalleryAdmin() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState(emptyImageForm);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editImage, setEditImage] = useState(emptyImageForm);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [backgroundSettingId, setBackgroundSettingId] = useState(null);
  const [message, setMessage] = useState("");
  const newImageLibraryInputRef = useRef(null);
  const newImageCameraInputRef = useRef(null);
  const editImageLibraryInputRef = useRef(null);
  const editImageCameraInputRef = useRef(null);

  const fetchImages = useCallback(async () => {
    try {
      const data = await getGalleryAdmin(token);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          tr("Erreur lors du chargement de la galerie", "Error while loading gallery")
      );
    }
  }, [token, tr]);

  useEffect(() => {
    if (authLoading) return;
    if (!token || user?.role !== "ADMIN") return;
    fetchImages();
  }, [authLoading, token, user, fetchImages]);

  useEffect(() => {
    if (!newImageFile) {
      setNewImagePreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(newImageFile);
    setNewImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [newImageFile]);

  useEffect(() => {
    if (!editImageFile) {
      setEditImagePreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(editImageFile);
    setEditImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [editImageFile]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newImageFile) {
      setMessage(tr("Selectionnez un fichier image", "Select an image file"));
      return;
    }

    try {
      setLoading(true);
      const uploaded = await uploadGalleryImage(token, newImageFile);
      const payload = {
        ...normalizeImagePayload(newImage),
        imageUrl: uploaded.imageUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
      };

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

  const handleImagePick = (setFile, event) => {
    const pickedFile = event.target.files?.[0] || null;
    setFile(pickedFile);
    event.target.value = "";
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
          thumbnailUrl: uploaded.thumbnailUrl,
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
      setMessage(
        err.response?.data?.error ||
          tr("Erreur lors du changement de statut", "Error while changing status")
      );
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

  const handleSetHomeBackground = async (image) => {
    try {
      setBackgroundSettingId(image.id);
      await setGalleryHomeBackground(token, image.id);
      setMessage(tr("Image de fond Home mise a jour.", "Home background image updated."));
      fetchImages();
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          tr("Erreur lors du changement de fond Home", "Error while updating Home background")
      );
    } finally {
      setBackgroundSettingId(null);
    }
  };

  if (authLoading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-white">
        {tr("Gestion de la galerie d'accueil", "Homepage gallery management")}
      </h2>
      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>
      )}

      <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
        <h3 className="text-lg font-semibold text-white">{tr("Ajouter une image", "Add image")}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="!bg-white/10 !text-white hover:!bg-white/20"
            onClick={() => newImageLibraryInputRef.current?.click()}
          >
            {tr("Choisir une photo", "Choose photo")}
          </button>
          <button
            type="button"
            className="!bg-sky-700/80 !text-white hover:!bg-sky-600"
            onClick={() => newImageCameraInputRef.current?.click()}
          >
            {tr("Prendre une photo", "Take photo")}
          </button>
        </div>
        <input
          ref={newImageLibraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleImagePick(setNewImageFile, event)}
        />
        <input
          ref={newImageCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleImagePick(setNewImageFile, event)}
        />

        <ImagePreviewCard
          previewUrl={newImagePreviewUrl}
          file={newImageFile}
          onClear={() => setNewImageFile(null)}
          tr={tr}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Titre (optionnel)", "Title (optional)")}</span>
            <input
              id="gallery-new-title"
              placeholder={tr("Titre (optionnel)", "Title (optional)")}
              value={newImage.title}
              onChange={(event) => setNewImage((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Description", "Description")}</span>
            <input
              id="gallery-new-description"
              placeholder={tr("Description", "Description")}
              value={newImage.description}
              onChange={(event) => setNewImage((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Texte alternatif", "Alt text")}</span>
            <input
              id="gallery-new-alt-text"
              placeholder={tr("Texte alternatif", "Alt text")}
              value={newImage.altText}
              onChange={(event) => setNewImage((prev) => ({ ...prev, altText: event.target.value }))}
            />
          </label>
          <label className="grid gap-1 text-xs text-stone-300">
            <span>{tr("Ordre", "Order")}</span>
            <input
              id="gallery-new-sort-order"
              type="number"
              min="0"
              placeholder={tr("Ordre", "Order")}
              value={newImage.sortOrder}
              onChange={(event) => setNewImage((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full">
          {tr("Ajouter", "Add")}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">{tr("Images enregistrees", "Saved images")}</h3>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>{tr("Apercu", "Preview")}</th>
                <th>{tr("Titre", "Title")}</th>
                <th>{tr("Description", "Description")}</th>
                <th>{tr("Ordre", "Order")}</th>
                <th>{tr("Actif", "Active")}</th>
                <th>{tr("Fond Home", "Home background")}</th>
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
                  <td>
                    <img
                      src={image.thumbnailUrl || image.imageUrl}
                      alt={image.altText || image.title || `${tr("Image", "Image")} ${image.id}`}
                      className="h-[60px] w-[90px] rounded-md object-cover"
                    />
                  </td>
                  <td>{image.title || "-"}</td>
                  <td>{image.description || "-"}</td>
                  <td>{image.sortOrder}</td>
                  <td>{image.active ? tr("Oui", "Yes") : tr("Non", "No")}</td>
                  <td>
                    {image.isHomeBackground ? (
                      <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                        {tr("Actif", "Active")}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">{tr("Non defini", "Not set")}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex min-w-[240px] items-center gap-2">
                      <ActionIconButton onClick={() => startEditing(image)} label={tr("Modifier", "Edit")}>
                        <EditIcon />
                      </ActionIconButton>
                      <StatusToggle
                        checked={image.active}
                        onChange={() => handleToggleActive(image)}
                        labelOn={tr("Desactiver", "Disable")}
                        labelOff={tr("Activer", "Enable")}
                      />
                      <button
                        type="button"
                        onClick={() => handleSetHomeBackground(image)}
                        disabled={image.isHomeBackground || backgroundSettingId === image.id}
                        className="rounded-md border border-saffron/40 bg-saffron/15 px-2 py-1 text-xs font-semibold text-saffron transition hover:bg-saffron/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {image.isHomeBackground
                          ? tr("Fond Home", "Home background")
                          : backgroundSettingId === image.id
                            ? tr("En cours...", "Updating...")
                            : tr("Definir fond", "Set background")}
                      </button>
                      <ActionIconButton onClick={() => handleDelete(image.id)} label={tr("Supprimer", "Delete")} variant="danger">
                        <DeleteIcon />
                      </ActionIconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
          <h3 className="text-lg font-semibold text-white">
            {tr("Modifier l'image", "Edit image")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="!bg-white/10 !text-white hover:!bg-white/20"
                  onClick={() => editImageLibraryInputRef.current?.click()}
                >
                  {tr("Choisir une photo", "Choose photo")}
                </button>
                <button
                  type="button"
                  className="!bg-sky-700/80 !text-white hover:!bg-sky-600"
                  onClick={() => editImageCameraInputRef.current?.click()}
                >
                  {tr("Prendre une photo", "Take photo")}
                </button>
              </div>
              <input
                ref={editImageLibraryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImagePick(setEditImageFile, event)}
              />
              <input
                ref={editImageCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => handleImagePick(setEditImageFile, event)}
              />
            </div>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Titre", "Title")}</span>
              <input
                id="gallery-edit-title"
                placeholder={tr("Titre", "Title")}
                value={editImage.title}
                onChange={(event) => setEditImage((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Description", "Description")}</span>
              <input
                id="gallery-edit-description"
                placeholder={tr("Description", "Description")}
                value={editImage.description}
                onChange={(event) => setEditImage((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Texte alternatif", "Alt text")}</span>
              <input
                id="gallery-edit-alt-text"
                placeholder={tr("Texte alternatif", "Alt text")}
                value={editImage.altText}
                onChange={(event) => setEditImage((prev) => ({ ...prev, altText: event.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Ordre", "Order")}</span>
              <input
                id="gallery-edit-sort-order"
                type="number"
                min="0"
                placeholder={tr("Ordre", "Order")}
                value={editImage.sortOrder}
                onChange={(event) => setEditImage((prev) => ({ ...prev, sortOrder: event.target.value }))}
              />
            </label>
          </div>

          <ImagePreviewCard
            previewUrl={editImagePreviewUrl || editImage.imageUrl}
            file={editImageFile}
            onClear={() => setEditImageFile(null)}
            tr={tr}
          />

          <label className="inline-flex items-center gap-2 text-sm text-stone-200">
            <input
              type="checkbox"
              checked={editImage.active}
              onChange={(event) => setEditImage((prev) => ({ ...prev, active: event.target.checked }))}
            />
            {tr("Active", "Active")}
          </label>
          <div className="flex flex-wrap gap-2">
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
