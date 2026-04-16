import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { BagInput } from "@/data/baggageDatabase";

interface BagRow extends BagInput {
  key: number;
}

let keyCounter = 0;

interface AddBaggageFormProps {
  onSubmit: (bags: BagInput[]) => Promise<void>;
  disabled?: boolean;
}

const BAG_TYPES: { value: BagInput["bag_type"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "cabin", label: "Cabin" },
  { value: "oversized", label: "Oversized" },
  { value: "fragile", label: "Fragile" },
];

const AddBaggageForm = ({ onSubmit, disabled }: AddBaggageFormProps) => {
  const [bags, setBags] = useState<BagRow[]>([
    { key: ++keyCounter, bag_type: "normal", weight: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addBag = () => {
    setBags((prev) => [
      ...prev,
      { key: ++keyCounter, bag_type: "normal", weight: 0 },
    ]);
  };

  const removeBag = (key: number) => {
    setBags((prev) => prev.filter((b) => b.key !== key));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateBag = (key: number, field: keyof BagInput, value: any) => {
    setBags((prev) =>
      prev.map((b) => (b.key === key ? { ...b, [field]: value } : b))
    );
    // Clear error on edit
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<number, string> = {};
    bags.forEach((bag) => {
      if (!bag.weight || bag.weight <= 0) {
        newErrors[bag.key] = "Enter valid bag weight";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(
        bags.map(({ bag_type, weight }) => ({ bag_type, weight }))
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {bags.map((bag, index) => (
        <Card key={bag.key} className="border-sky-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-heading font-semibold">
                Bag {index + 1}
              </span>
              {bags.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeBag(bag.key)}
                  disabled={submitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Bag Type
                </label>
                <Select
                  value={bag.bag_type}
                  onValueChange={(v) =>
                    updateBag(bag.key, "bag_type", v as BagInput["bag_type"])
                  }
                  disabled={submitting}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BAG_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={bag.weight || ""}
                  onChange={(e) =>
                    updateBag(bag.key, "weight", parseFloat(e.target.value) || 0)
                  }
                  className="h-9 text-sm"
                  placeholder="e.g. 15"
                  disabled={submitting}
                />
                {errors[bag.key] && (
                  <p className="text-xs text-destructive mt-1">
                    {errors[bag.key]}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-heading"
          onClick={addBag}
          disabled={submitting || disabled}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Another Bag
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-11 bg-primary hover:bg-sky-600 font-heading"
        disabled={submitting || disabled || bags.length === 0}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating Tags...
          </>
        ) : (
          `Check-in & Generate ${bags.length} Tag${bags.length > 1 ? "s" : ""}`
        )}
      </Button>
    </div>
  );
};

export default AddBaggageForm;
