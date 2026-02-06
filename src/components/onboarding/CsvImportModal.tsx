/**
 * CSV IMPORT MODAL — Import de portefeuille CSV
 * =============================================
 * Modal drag & drop pour importer un fichier CSV de copropriétés.
 * 
 * @author JB
 * @date 2026-02-03
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Loader2
} from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: CsvRow[]) => void;
}

interface CsvRow {
  address: string;
  postalCode: string;
  city: string;
  nbLots?: number | undefined;
  dpe?: string;
  surface?: number | undefined;
  [key: string]: string | number | undefined;
}

interface ParseResult {
  data: CsvRow[];
  errors: string[];
  rowCount: number;
}

export function CsvImportModal({ isOpen, onClose, onImport }: CsvImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      parseCSV(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  }, []);

  const parseCSV = async (file: File) => {
    setIsParsing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setParseResult({
          data: [],
          errors: ["Le fichier semble vide ou mal formaté"],
          rowCount: 0
        });
        setIsParsing(false);
        return;
      }

      // Parse headers
      const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase());
      
      const data: CsvRow[] = [];
      const errors: string[] = [];

      // Parse rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]!.split(',').map(v => v.trim());
        
        if (values.length < 3) {
          errors.push(`Ligne ${i + 1}: trop peu de colonnes`);
          continue;
        }

        const row: CsvRow = {
          address: values[0] || '',
          postalCode: values[1] || '',
          city: values[2] || '',
        };

        if (values[3]) row.nbLots = parseInt(values[3]) || 0;
        if (values[4]) row.dpe = values[4];
        if (values[5]) row.surface = parseInt(values[5]) || 0;

        if (row.address && row.postalCode && row.city) {
          data.push(row);
        } else {
          errors.push(`Ligne ${i + 1}: données incomplètes`);
        }
      }

      setParseResult({
        data,
        errors,
        rowCount: data.length
      });
    } catch (error) {
      setParseResult({
        data: [],
        errors: ["Erreur lors de la lecture du fichier"],
        rowCount: 0
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (parseResult?.data.length) {
      onImport(parseResult.data);
      reset();
      onClose();
    }
  };

  const reset = () => {
    setFile(null);
    setParseResult(null);
    setIsParsing(false);
  };

  const downloadTemplate = () => {
    const csv = `adresse,code_postal,ville,nb_lots,dpe,surface
12 rue de la Paix,75002,Paris,25,F,85
45 avenue Victor Hugo,13008,Marseille,40,G,120
8 boulevard Haussmann,75009,Paris,15,E,65`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_valo_syndic.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-white">Import de portefeuille</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {!file ? (
              /* Zone de drop */
              <>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8
                    transition-all duration-200
                    flex flex-col items-center justify-center text-center
                    ${isDragging 
                      ? "border-gold bg-gold/10" 
                      : "border-white/20 hover:border-white/40 hover:bg-white/5"
                    }
                  `}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <Upload className={`
                    w-12 h-12 mb-4 transition-colors
                    ${isDragging ? "text-gold" : "text-muted"}
                  `} />
                  
                  <p className="text-white font-medium mb-2">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-sm text-muted">
                    ou cliquez pour parcourir
                  </p>
                </div>

                {/* Template download */}
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 
                    bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl
                    text-sm text-muted hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger un modèle CSV
                </button>

                {/* Format info */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-muted mb-2">Format attendu:</p>
                  <code className="text-xs text-gold/80 font-mono">
                    adresse, code_postal, ville, nb_lots, dpe, surface
                  </code>
                </div>
              </>
            ) : (
              /* Résultat du parsing */
              <>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <FileSpreadsheet className="w-10 h-10 text-gold" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted" />
                  </button>
                </div>

                {isParsing ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                    <p className="text-muted">Analyse du fichier...</p>
                  </div>
                ) : parseResult ? (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-success">
                          {parseResult.rowCount}
                        </p>
                        <p className="text-xs text-success/80">Immeubles trouvés</p>
                      </div>
                      <div className={`
                        rounded-xl p-4 text-center
                        ${parseResult.errors.length > 0 
                          ? "bg-warning/10 border border-warning/30" 
                          : "bg-white/5 border border-white/10"
                        }
                      `}>
                        <p className={`
                          text-2xl font-bold
                          ${parseResult.errors.length > 0 ? "text-warning" : "text-muted"}
                        `}>
                          {parseResult.errors.length}
                        </p>
                        <p className="text-xs text-muted">Erreurs</p>
                      </div>
                    </div>

                    {/* Errors */}
                    {parseResult.errors.length > 0 && (
                      <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 max-h-32 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-warning" />
                          <p className="text-sm font-medium text-warning">
                            Avertissements
                          </p>
                        </div>
                        <ul className="space-y-1">
                          {parseResult.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-xs text-muted">
                              • {error}
                            </li>
                          ))}
                          {parseResult.errors.length > 5 && (
                            <li className="text-xs text-muted">
                              ... et {parseResult.errors.length - 5} autres
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Confirm button */}
                    <button
                      onClick={handleConfirm}
                      disabled={parseResult.rowCount === 0}
                      className={`
                        w-full py-3 px-4 rounded-xl font-medium
                        flex items-center justify-center gap-2
                        transition-all duration-200
                        ${parseResult.rowCount > 0
                          ? "bg-gold hover:bg-gold-light text-black"
                          : "bg-white/5 text-white/40 cursor-not-allowed"
                        }
                      `}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Importer {parseResult.rowCount} immeuble{parseResult.rowCount > 1 ? 's' : ''}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
