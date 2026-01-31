'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export interface DocumentLine {
  prestationId: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  tauxTva: number;
}

interface DocumentLinesEditorProps {
  lines: DocumentLine[];
  onChange: (lines: DocumentLine[]) => void;
  prestations: any[];
  tvaApplicable: boolean;
  defaultTva: number;
}

const EMPTY_LINE: DocumentLine = {
  prestationId: '',
  description: '',
  quantite: 1,
  unite: 'heure',
  prixUnitaire: 0,
  tauxTva: 0,
};

export function DocumentLinesEditor({
  lines,
  onChange,
  prestations,
  tvaApplicable,
  defaultTva,
}: DocumentLinesEditorProps) {
  const addLine = () => {
    onChange([...lines, { ...EMPTY_LINE, tauxTva: tvaApplicable ? defaultTva : 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof DocumentLine, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const selectPrestation = (index: number, prestationId: string) => {
    if (prestationId === '_manual') {
      updateLine(index, 'prestationId', '');
      return;
    }
    const presta = prestations.find((p: any) => p.id === prestationId);
    if (presta) {
      const updated = [...lines];
      updated[index] = {
        ...updated[index],
        prestationId,
        description: presta.nom + (presta.description ? ` — ${presta.description}` : ''),
        prixUnitaire:
          presta.typeTarif === 'FORFAIT'
            ? Number(presta.prixForfait || 0)
            : Number(presta.tauxHoraire || 0),
        unite:
          presta.typeTarif === 'FORFAIT'
            ? 'forfait'
            : presta.typeTarif === 'JOURNALIER'
            ? 'jour'
            : 'heure',
        quantite:
          presta.typeTarif === 'FORFAIT'
            ? 1
            : presta.dureeMinutes / 60,
        tauxTva: presta.tauxTvaSpecifique
          ? Number(presta.tauxTvaSpecifique)
          : tvaApplicable
          ? defaultTva
          : 0,
      };
      onChange(updated);
    }
  };

  // Calcul des totaux
  const totals = lines.reduce(
    (acc, line) => {
      const ht = line.quantite * line.prixUnitaire;
      const tva = ht * (line.tauxTva / 100);
      return {
        ht: acc.ht + ht,
        tva: acc.tva + tva,
        ttc: acc.ttc + ht + tva,
      };
    },
    { ht: 0, tva: 0, ttc: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Lignes</Label>
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une ligne
        </Button>
      </div>

      {lines.map((line, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Ligne {index + 1}
            </span>
            {lines.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeLine(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Prestation selector */}
          <div className="space-y-1">
            <Label className="text-xs">Prestation</Label>
            <Select
              value={line.prestationId || '_manual'}
              onValueChange={(v) => selectPrestation(index, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Saisie manuelle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_manual">Saisie manuelle</SelectItem>
                {prestations.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} —{' '}
                    {p.typeTarif === 'FORFAIT'
                      ? `${Number(p.prixForfait).toFixed(0)} € forfait`
                      : `${Number(p.tauxHoraire).toFixed(0)} €/${
                          p.typeTarif === 'JOURNALIER' ? 'jour' : 'h'
                        }`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">Description *</Label>
            <Textarea
              value={line.description}
              onChange={(e) => updateLine(index, 'description', e.target.value)}
              rows={2}
              required
              placeholder="Description de la prestation"
            />
          </div>

          {/* Quantité, Unité, Prix unitaire, TVA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Quantité</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={line.quantite}
                onChange={(e) =>
                  updateLine(index, 'quantite', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unité</Label>
              <Select
                value={line.unite}
                onValueChange={(v) => updateLine(index, 'unite', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heure">Heure(s)</SelectItem>
                  <SelectItem value="jour">Jour(s)</SelectItem>
                  <SelectItem value="forfait">Forfait</SelectItem>
                  <SelectItem value="unité">Unité(s)</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prix unitaire HT (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={line.prixUnitaire}
                onChange={(e) =>
                  updateLine(index, 'prixUnitaire', parseFloat(e.target.value) || 0)
                }
              />
            </div>
            {tvaApplicable && (
              <div className="space-y-1">
                <Label className="text-xs">TVA (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={line.tauxTva}
                  onChange={(e) =>
                    updateLine(index, 'tauxTva', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            )}
          </div>

          {/* Line total */}
          <div className="flex justify-end text-sm">
            <span className="text-muted-foreground mr-2">Total HT :</span>
            <span className="font-medium">
              {(line.quantite * line.prixUnitaire).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total HT</span>
          <span className="font-medium">
            {totals.ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
        {tvaApplicable && totals.tva > 0 && (
          <div className="flex justify-between text-sm">
            <span>TVA</span>
            <span>
              {totals.tva.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t pt-2">
          <span>Total TTC</span>
          <span>
            {totals.ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>
    </div>
  );
}
