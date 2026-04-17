import React, { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Upload, Download, Home, FileText, ClipboardList, Search, Camera } from "lucide-react";

const CONDITION_OPTIONS = [
  { value: "", label: "Non renseigné" },
  { value: "neuf", label: "Neuf" },
  { value: "bon", label: "Bon" },
  { value: "usage", label: "Usage" },
  { value: "moyen", label: "Moyen" },
  { value: "mauvais", label: "Mauvais" },
  { value: "absent", label: "Absent" },
];

const DEFAULT_TEMPLATES = {
  Entree: ["Porte", "Sol", "Murs", "Plafond", "Fenêtres", "Éclairage", "Prises", "Radiateur"],
  Sejour: ["Porte", "Sol", "Murs", "Plafond", "Fenêtres", "Éclairage", "Prises", "Radiateur"],
  Cuisine: ["Porte", "Sol", "Murs", "Plafond", "Fenêtres", "Éclairage", "Prises", "Meubles", "Évier", "Robinetterie"],
  SalleDeBains: ["Porte", "Sol", "Murs", "Plafond", "Fenêtres", "Éclairage", "Lavabo", "Douche", "Baignoire", "WC", "Robinetterie", "Ventilation"],
  Chambre: ["Porte", "Sol", "Murs", "Plafond", "Fenêtres", "Éclairage", "Prises", "Placard", "Radiateur"],
  WC: ["Porte", "Sol", "Murs", "Plafond", "Éclairage", "WC", "Lave-mains", "Ventilation"],
  Balcon: ["Sol", "Murs", "Garde-corps", "Éclairage", "Évacuation"],
  Cave: ["Porte", "Sol", "Murs", "Plafond", "Éclairage"],
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function createInspectionItem(label) {
  return {
    id: uid(),
    label,
    entryCondition: "bon",
    entryNotes: "",
    entryPhotos: [],
    exitCondition: "",
    exitNotes: "",
    exitPhotos: [],
  };
}

function createRoom(name, templateKey = "Entree") {
  const source = DEFAULT_TEMPLATES[templateKey] || DEFAULT_TEMPLATES.Entree;
  return {
    id: uid(),
    name,
    open: true,
    items: source.map(createInspectionItem),
  };
}

function fileToPreview(file) {
  return {
    id: uid(),
    name: file.name,
    url: URL.createObjectURL(file),
  };
}

function exportJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function loadJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={styles.iconBox}>{icon}</div>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function ConditionSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
      {CONDITION_OPTIONS.map((option) => (
        <option key={option.value || "empty"} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function PhotoUploader({ photos, onAdd, onRemove }) {
  const inputRef = useRef(null);

  function handleFiles(files) {
    if (!files || !files.length) return;
    const nextPhotos = Array.from(files).map(fileToPreview);
    onAdd(nextPhotos);
  }

  return (
    <div>
      <button type="button" style={styles.secondaryButton} onClick={() => inputRef.current?.click()}>
        <Upload size={16} />
        <span>Ajouter des photos</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length > 0 && (
        <div style={styles.photoGrid}>
          {photos.map((photo) => (
            <div key={photo.id} style={styles.photoCard}>
              <img src={photo.url} alt={photo.name} style={styles.photoImage} />
              <div style={styles.photoFooter}>
                <div style={styles.photoName}>{photo.name}</div>
                <button type="button" style={styles.linkDanger} onClick={() => onRemove(photo.id)}>
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InspectionRow({ item, onUpdate, onDelete }) {
  const update = (patch) => onUpdate({ ...item, ...patch });

  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <strong style={{ fontSize: 16 }}>{item.label}</strong>
        <button type="button" style={styles.iconButtonDanger} onClick={onDelete}>
          <Trash2 size={16} />
        </button>
      </div>

      <div style={styles.dualGrid}>
        <div style={{ ...styles.statePanel, background: "#f8fafc" }}>
          <div style={styles.badgeBlue}>Entrée</div>
          <label style={styles.label}>État</label>
          <ConditionSelect value={item.entryCondition} onChange={(value) => update({ entryCondition: value })} />

          <label style={styles.label}>Observations</label>
          <textarea
            value={item.entryNotes}
            onChange={(e) => update({ entryNotes: e.target.value })}
            placeholder="Commentaires, anomalies, usures..."
            style={styles.textarea}
          />

          <label style={styles.label}>Photos</label>
          <PhotoUploader
            photos={item.entryPhotos}
            onAdd={(newPhotos) => update({ entryPhotos: [...item.entryPhotos, ...newPhotos] })}
            onRemove={(photoId) => update({ entryPhotos: item.entryPhotos.filter((p) => p.id !== photoId) })}
          />
        </div>

        <div style={{ ...styles.statePanel, background: "#fff7ed" }}>
          <div style={styles.badgeOrange}>Sortie</div>
          <label style={styles.label}>État</label>
          <ConditionSelect value={item.exitCondition} onChange={(value) => update({ exitCondition: value })} />

          <label style={styles.label}>Observations</label>
          <textarea
            value={item.exitNotes}
            onChange={(e) => update({ exitNotes: e.target.value })}
            placeholder="Dégradations, différences, remarques..."
            style={styles.textarea}
          />

          <label style={styles.label}>Photos</label>
          <PhotoUploader
            photos={item.exitPhotos}
            onAdd={(newPhotos) => update({ exitPhotos: [...item.exitPhotos, ...newPhotos] })}
            onRemove={(photoId) => update({ exitPhotos: item.exitPhotos.filter((p) => p.id !== photoId) })}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dossier");
  const [propertyInfo, setPropertyInfo] = useState({
    reference: "",
    address: "",
    tenant: "",
    owner: "",
    entryDate: "",
    exitDate: "",
    notes: "",
  });

  const [rooms, setRooms] = useState([
    createRoom("Entrée", "Entree"),
    createRoom("Séjour", "Sejour"),
    createRoom("Cuisine", "Cuisine"),
    createRoom("Salle de bains", "SalleDeBains"),
  ]);

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTemplate, setNewRoomTemplate] = useState("Entree");
  const [globalSearch, setGlobalSearch] = useState("");
  const importRef = useRef(null);

  const filteredRooms = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return rooms;

    return rooms
      .map((room) => ({
        ...room,
        items: room.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((room) => room.name.toLowerCase().includes(q) || room.items.length > 0);
  }, [rooms, globalSearch]);

  function updateProperty(field, value) {
    setPropertyInfo((prev) => ({ ...prev, [field]: value }));
  }

  function addRoom() {
    const label = newRoomName.trim() || `Pièce ${rooms.length + 1}`;
    setRooms((prev) => [...prev, createRoom(label, newRoomTemplate)]);
    setNewRoomName("");
    setNewRoomTemplate("Entree");
  }

  function deleteRoom(roomId) {
    setRooms((prev) => prev.filter((room) => room.id !== roomId));
  }

  function toggleRoom(roomId) {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, open: !room.open } : room)));
  }

  function updateRoomName(roomId, name) {
    setRooms((prev) => prev.map((room) => (room.id === roomId ? { ...room, name } : room)));
  }

  function addItemToRoom(roomId, label = "Nouveau point de contrôle") {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, items: [...room.items, createInspectionItem(label)], open: true } : room
      )
    );
  }

  function updateItem(roomId, itemId, nextItem) {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, items: room.items.map((item) => (item.id === itemId ? nextItem : item)) }
          : room
      )
    );
  }

  function deleteItem(roomId, itemId) {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, items: room.items.filter((item) => item.id !== itemId) } : room
      )
    );
  }

  function handleExport() {
    exportJsonFile(`etat-des-lieux-${propertyInfo.reference || "dossier"}.json`, { propertyInfo, rooms });
  }

  async function handleImport(event) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      const data = await loadJsonFile(file);
      if (data.propertyInfo) setPropertyInfo(data.propertyInfo);
      if (Array.isArray(data.rooms)) setRooms(data.rooms);
    } catch (error) {
      alert("Le fichier importé est invalide.");
    } finally {
      event.target.value = "";
    }
  }

  const totalItems = rooms.reduce((sum, room) => sum + room.items.length, 0);
  const totalPhotos = rooms.reduce(
    (sum, room) => sum + room.items.reduce((inner, item) => inner + item.entryPhotos.length + item.exitPhotos.length, 0),
    0
  );

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <div style={styles.heroGrid}>
          <div style={styles.heroCard}>
            <SectionTitle
              icon={<Home size={20} />}
              title="État des lieux entrée / sortie"
              subtitle="Application web simple pour gérer les pièces, les contrôles, les états, les observations et les photos."
            />

            <div style={styles.heroActions}>
              <button type="button" style={styles.primaryButton} onClick={addRoom}>
                <ClipboardList size={16} />
                <span>Ajouter une pièce</span>
              </button>
              <button type="button" style={styles.secondaryButton} onClick={handleExport}>
                <Download size={16} />
                <span>Exporter JSON</span>
              </button>
              <button type="button" style={styles.secondaryButton} onClick={() => importRef.current?.click()}>
                <Upload size={16} />
                <span>Importer JSON</span>
              </button>
              <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={handleImport} />
            </div>
          </div>

          <div style={styles.statsCard}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{rooms.length}</div>
              <div style={styles.statLabel}>Pièces</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{totalItems}</div>
              <div style={styles.statLabel}>Contrôles</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{totalPhotos}</div>
              <div style={styles.statLabel}>Photos</div>
            </div>
          </div>
        </div>

        <div style={styles.tabs}>
          <button type="button" onClick={() => setActiveTab("dossier")} style={activeTab === "dossier" ? styles.tabActive : styles.tabButton}>
            Dossier
          </button>
          <button type="button" onClick={() => setActiveTab("controle")} style={activeTab === "controle" ? styles.tabActive : styles.tabButton}>
            Contrôle par pièce
          </button>
          <button type="button" onClick={() => setActiveTab("resume")} style={activeTab === "resume" ? styles.tabActive : styles.tabButton}>
            Résumé
          </button>
        </div>

        {activeTab === "dossier" && (
          <div style={styles.panel}>
            <SectionTitle icon={<FileText size={20} />} title="Informations générales" />
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Référence dossier</label>
                <input style={styles.input} value={propertyInfo.reference} onChange={(e) => updateProperty("reference", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Locataire</label>
                <input style={styles.input} value={propertyInfo.tenant} onChange={(e) => updateProperty("tenant", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Propriétaire / bailleur</label>
                <input style={styles.input} value={propertyInfo.owner} onChange={(e) => updateProperty("owner", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Adresse</label>
                <input style={styles.input} value={propertyInfo.address} onChange={(e) => updateProperty("address", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Date d’entrée</label>
                <input type="date" style={styles.input} value={propertyInfo.entryDate} onChange={(e) => updateProperty("entryDate", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Date de sortie</label>
                <input type="date" style={styles.input} value={propertyInfo.exitDate} onChange={(e) => updateProperty("exitDate", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Remarques générales</label>
                <textarea style={styles.textareaLarge} value={propertyInfo.notes} onChange={(e) => updateProperty("notes", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "controle" && (
          <div style={styles.stack}>
            <div style={styles.panel}>
              <div style={styles.toolbar}>
                <div style={styles.searchWrap}>
                  <Search size={16} color="#64748b" />
                  <input
                    style={styles.searchInput}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Rechercher une pièce ou un point de contrôle"
                  />
                </div>

                <div style={styles.inlineTools}>
                  <input
                    style={styles.input}
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Nom de la nouvelle pièce"
                  />
                  <select style={styles.select} value={newRoomTemplate} onChange={(e) => setNewRoomTemplate(e.target.value)}>
                    {Object.keys(DEFAULT_TEMPLATES).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                  <button type="button" style={styles.primaryButton} onClick={addRoom}>
                    <Plus size={16} />
                    <span>Créer</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredRooms.map((room) => (
              <div key={room.id} style={styles.panel}>
                <div style={styles.roomHeader}>
                  <div>
                    <strong style={{ fontSize: 18 }}>{room.name}</strong>
                    <div style={styles.muted}>{room.items.length} point(s) de contrôle</div>
                  </div>

                  <div style={styles.roomActions}>
                    <button type="button" style={styles.secondaryButton} onClick={() => toggleRoom(room.id)}>
                      {room.open ? "Réduire" : "Ouvrir"}
                    </button>
                    <button type="button" style={styles.secondaryButton} onClick={() => addItemToRoom(room.id)}>
                      <Plus size={16} />
                      <span>Ajouter un contrôle</span>
                    </button>
                    <button type="button" style={styles.dangerButton} onClick={() => deleteRoom(room.id)}>
                      <Trash2 size={16} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                {room.open && (
                  <div style={styles.stack}>
                    <div>
                      <label style={styles.label}>Nom de la pièce</label>
                      <input style={styles.input} value={room.name} onChange={(e) => updateRoomName(room.id, e.target.value)} />
                    </div>

                    {room.items.map((item) => (
                      <div key={item.id} style={styles.stack}>
                        <div>
                          <label style={styles.label}>Élément à contrôler</label>
                          <input
                            style={styles.input}
                            value={item.label}
                            onChange={(e) => updateItem(room.id, item.id, { ...item, label: e.target.value })}
                          />
                        </div>
                        <InspectionRow
                          item={item}
                          onUpdate={(nextItem) => updateItem(room.id, item.id, nextItem)}
                          onDelete={() => deleteItem(room.id, item.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "resume" && (
          <div style={styles.panel}>
            <SectionTitle icon={<Camera size={20} />} title="Résumé du dossier" />

            <div style={styles.summaryGrid}>
              <div style={styles.summaryBox}><span style={styles.muted}>Référence</span><strong>{propertyInfo.reference || "—"}</strong></div>
              <div style={styles.summaryBox}><span style={styles.muted}>Locataire</span><strong>{propertyInfo.tenant || "—"}</strong></div>
              <div style={styles.summaryBox}><span style={styles.muted}>Entrée</span><strong>{propertyInfo.entryDate || "—"}</strong></div>
              <div style={styles.summaryBox}><span style={styles.muted}>Sortie</span><strong>{propertyInfo.exitDate || "—"}</strong></div>
            </div>

            <div style={styles.stack}>
              {rooms.map((room) => (
                <div key={room.id} style={styles.summaryRoom}>
                  <strong style={{ fontSize: 17 }}>{room.name}</strong>
                  <div style={styles.summaryItems}>
                    {room.items.map((item) => (
                      <div key={item.id} style={styles.summaryItem}>
                        <strong>{item.label}</strong>
                        <div style={styles.muted}>Entrée : {item.entryCondition || "—"}</div>
                        <div style={styles.muted}>Sortie : {item.exitCondition || "—"}</div>
                        <div style={styles.muted}>Photos : {item.entryPhotos.length + item.exitPhotos.length}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f1f5f9",
    padding: 24,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#0f172a",
  },
  container: {
    maxWidth: 1300,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
  },
  heroCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  statsCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    alignItems: "stretch",
  },
  statBox: {
    background: "#f8fafc",
    borderRadius: 18,
    padding: 16,
    textAlign: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  heroActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 18,
  },
  panel: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
  stack: {
    display: "grid",
    gap: 20,
  },
  tabs: {
    display: "flex",
    gap: 8,
    background: "#ffffff",
    padding: 8,
    borderRadius: 18,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
    flexWrap: "wrap",
  },
  tabButton: {
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 600,
    color: "#334155",
  },
  tabActive: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 600,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  sectionSubtitle: {
    margin: "4px 0 0 0",
    color: "#64748b",
    fontSize: 14,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    marginTop: 20,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    background: "#ffffff",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    background: "#ffffff",
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    resize: "vertical",
    background: "#ffffff",
  },
  textareaLarge: {
    width: "100%",
    minHeight: 140,
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    resize: "vertical",
    background: "#ffffff",
  },
  toolbar: {
    display: "grid",
    gap: 14,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 14,
    padding: "0 14px",
  },
  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "12px 0",
    fontSize: 14,
    background: "transparent",
  },
  inlineTools: {
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr auto",
    gap: 12,
  },
  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  roomActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  itemCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 18,
    background: "#ffffff",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  dualGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  statePanel: {
    borderRadius: 18,
    padding: 16,
    border: "1px solid #e2e8f0",
  },
  badgeBlue: {
    display: "inline-block",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 12,
  },
  badgeOrange: {
    display: "inline-block",
    background: "#fed7aa",
    color: "#c2410c",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 12,
  },
  primaryButton: {
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 14,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  dangerButton: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: 14,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  iconButtonDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  photoGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
  },
  photoCard: {
    borderRadius: 16,
    overflow: "hidden",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  photoImage: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    display: "block",
  },
  photoFooter: {
    padding: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  photoName: {
    fontSize: 12,
    color: "#475569",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  linkDanger: {
    background: "transparent",
    border: "none",
    color: "#be123c",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
  },
  muted: {
    color: "#64748b",
    fontSize: 14,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    margin: "20px 0",
  },
  summaryBox: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    display: "grid",
    gap: 6,
  },
  summaryRoom: {
    borderRadius: 18,
    background: "#f8fafc",
    padding: 18,
    display: "grid",
    gap: 12,
  },
  summaryItems: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  summaryItem: {
    borderRadius: 14,
    background: "#ffffff",
    padding: 14,
    border: "1px solid #e2e8f0",
    display: "grid",
    gap: 6,
  },
};
