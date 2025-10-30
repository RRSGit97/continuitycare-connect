import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  template_type: string;
  duration_days: number;
}

interface TemplatesListProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  onCreateNew: () => void;
}

export const TemplatesList = ({ templates, onSelectTemplate, onCreateNew }: TemplatesListProps) => {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'CABG': 'bg-red-100 text-red-800',
      'THR': 'bg-blue-100 text-blue-800',
      'TKR': 'bg-green-100 text-green-800',
      'Kidney Transplant': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Care Plan Templates</h2>
        <Button onClick={onCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <Badge className={getTypeColor(template.template_type)}>
                  {template.template_type}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {template.duration_days} days
                </span>
                <Button onClick={() => onSelectTemplate(template)} size="sm" variant="outline">
                  Assign to Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
