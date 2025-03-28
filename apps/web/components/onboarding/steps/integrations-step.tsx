import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Service integrations data
const serviceIntegrations = [
  {
    id: "google",
    name: "Google",
    icon: "G",
    description: "Connect with Google Calendar, Tasks, and Gmail",
    permissions: [
      { id: "calendar", label: "Calendar access", description: "Sync tasks with your Google Calendar" },
      { id: "tasks", label: "Tasks access", description: "Import and export tasks from Google Tasks" },
      { id: "gmail", label: "Gmail access", description: "Send email reminders through Gmail" },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: "M",
    description: "Connect with Outlook Calendar, To Do, and Teams",
    permissions: [
      { id: "calendar", label: "Calendar access", description: "Sync tasks with your Outlook Calendar" },
      { id: "todo", label: "To Do access", description: "Import and export tasks from Microsoft To Do" },
      { id: "teams", label: "Teams access", description: "Send reminders through Teams" },
    ],
  },
  {
    id: "messaging",
    name: "Messaging Platforms",
    icon: "💬",
    description: "Connect with WhatsApp, Telegram, or SMS",
    permissions: [
      { id: "whatsapp", label: "WhatsApp", description: "Send reminders through WhatsApp" },
      { id: "telegram", label: "Telegram", description: "Send reminders through Telegram" },
      { id: "sms", label: "SMS", description: "Send reminders through SMS" },
    ],
  },
];

// Device permissions data
const devicePermissions = [
  {
    id: "notifications",
    title: "Push Notifications",
    description: "Allow SmartTodos to send you notifications about tasks and reminders",
    essential: true,
  },
  {
    id: "location",
    title: "Location Access",
    description: "Enable location-based reminders and task suggestions",
    essential: false,
  },
  {
    id: "calendar",
    title: "Calendar Access",
    description: "Allow SmartTodos to read and create calendar events",
    essential: false,
  },
  {
    id: "contacts",
    title: "Contacts Access",
    description: "Allow SmartTodos to suggest collaborators from your contacts",
    essential: false,
  },
];

interface IntegrationsStepProps {
  selectedIntegrations: string[];
  isLoading: boolean;
  onIntegrationToggle: (integration: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function IntegrationsStep({
  selectedIntegrations,
  isLoading,
  onIntegrationToggle,
  onPrevious,
  onNext
}: IntegrationsStepProps): React.ReactNode {
  // Track connected services and their permissions
  const [connectedServices, setConnectedServices] = React.useState<Record<string, boolean>>({});
  const [servicePermissions, setServicePermissions] = React.useState<Record<string, string[]>>({});
  const [grantedPermissions, setGrantedPermissions] = React.useState<Record<string, boolean>>({
    // Default essential permissions to true
    notifications: true,
  });

  const handleServiceToggle = (serviceId: string) => {
    const newServices = { ...connectedServices, [serviceId]: !connectedServices[serviceId] };
    setConnectedServices(newServices);

    // Initialize permissions for this service if toggled on
    if (!connectedServices[serviceId]) {
      const service = serviceIntegrations.find((s) => s.id === serviceId);
      if (service) {
        setServicePermissions({
          ...servicePermissions,
          [serviceId]: service.permissions.map((p) => p.id),
        });
      }
    }

    // Update the user's selected integrations using the existing handler
    if (!connectedServices[serviceId]) {
      // When service is toggled on, add all its permissions to selectedIntegrations
      const service = serviceIntegrations.find((s) => s.id === serviceId);
      if (service) {
        service.permissions.forEach(p => {
          if (!selectedIntegrations.includes(`${serviceId}_${p.id}`)) {
            onIntegrationToggle(`${serviceId}_${p.id}`);
          }
        });
      }
    } else {
      // When service is toggled off, remove all its permissions from selectedIntegrations
      const service = serviceIntegrations.find((s) => s.id === serviceId);
      if (service) {
        service.permissions.forEach(p => {
          if (selectedIntegrations.includes(`${serviceId}_${p.id}`)) {
            onIntegrationToggle(`${serviceId}_${p.id}`);
          }
        });
      }
    }
  };

  const handlePermissionToggle = (serviceId: string, permissionId: string) => {
    const currentPermissions = servicePermissions[serviceId] || [];
    let newPermissions: string[];
    
    if (currentPermissions.includes(permissionId)) {
      newPermissions = currentPermissions.filter((id) => id !== permissionId);
      // Remove from selected integrations
      if (selectedIntegrations.includes(`${serviceId}_${permissionId}`)) {
        onIntegrationToggle(`${serviceId}_${permissionId}`);
      }
    } else {
      newPermissions = [...currentPermissions, permissionId];
      // Add to selected integrations
      if (!selectedIntegrations.includes(`${serviceId}_${permissionId}`)) {
        onIntegrationToggle(`${serviceId}_${permissionId}`);
      }
    }
    
    setServicePermissions({
      ...servicePermissions,
      [serviceId]: newPermissions,
    });
  };

  const handleDevicePermissionToggle = (permissionId: string) => {
    const newPermissions = { ...grantedPermissions, [permissionId]: !grantedPermissions[permissionId] };
    setGrantedPermissions(newPermissions);
    
    // Update the user's selected integrations
    onIntegrationToggle(`device_${permissionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Services</CardTitle>
        <CardDescription>Connect SmartTodos with your favorite apps and grant necessary permissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          <h3 className="font-medium">Service Integrations</h3>
          {serviceIntegrations.map((service) => (
            <div key={service.id} className="rounded-lg border p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </div>
                <Switch
                  checked={!!connectedServices[service.id]}
                  onCheckedChange={() => handleServiceToggle(service.id)}
                />
              </div>

              {connectedServices[service.id] && (
                <div className="space-y-3 pt-2 border-t">
                  <h5 className="text-sm font-medium">Permissions</h5>
                  {service.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${service.id}-${permission.id}`} className="text-sm">
                          {permission.label}
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs">{permission.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch
                        id={`${service.id}-${permission.id}`}
                        checked={servicePermissions[service.id]?.includes(permission.id) ?? false}
                        onCheckedChange={() => handlePermissionToggle(service.id, permission.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">App Permissions</h3>
          <Alert>
            <AlertDescription className="text-sm">
              These permissions enhance your experience but you can change them later in settings.
            </AlertDescription>
          </Alert>
          {devicePermissions.map((permission) => (
            <div key={permission.id} className="flex items-center justify-between py-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{permission.title}</h4>
                  {permission.essential && (
                    <Badge variant="outline" className="text-xs">
                      Essential
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{permission.description}</p>
              </div>
              <Switch
                checked={!!grantedPermissions[permission.id]}
                onCheckedChange={() => handleDevicePermissionToggle(permission.id)}
                disabled={permission.essential}
              />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 