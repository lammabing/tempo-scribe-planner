
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useCalendarContext } from '@/contexts/CalendarContext';
import { Download, Upload, AlertCircle, FileDown, FileUp } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('export');
  const [importData, setImportData] = useState<string>('');
  const [exportData, setExportData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { exportEvents, importEvents } = useCalendarContext();

  const handleExport = () => {
    try {
      const data = exportEvents();
      setExportData(data);
      setError(null);
    } catch (err) {
      setError('Failed to export calendar data.');
      console.error(err);
    }
  };

  const handleImport = async () => {
    setError(null);
    setImportSuccess(false);
    
    if (!importData.trim()) {
      setError('Please paste calendar data or upload a file.');
      return;
    }
    
    try {
      const success = await importEvents(importData);
      if (success) {
        setImportSuccess(true);
        setImportData('');
      }
    } catch (err) {
      setError('Failed to import calendar data. Please check the format.');
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import/Export Calendar</DialogTitle>
          <DialogDescription>
            Import or export your calendar data. This allows you to back up your calendar or move it between devices.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div>
              <Button 
                onClick={handleExport} 
                className="w-full mb-4"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Generate Export Data
              </Button>
              
              {exportData && (
                <>
                  <Textarea 
                    value={exportData} 
                    className="h-60 mb-4 font-mono text-xs" 
                    readOnly
                  />
                  
                  <Button 
                    onClick={handleDownload} 
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download as File
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex-1"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                </div>
                
                <p className="text-sm text-center text-muted-foreground">
                  or paste JSON data below
                </p>
                
                <Textarea 
                  value={importData} 
                  onChange={(e) => setImportData(e.target.value)} 
                  className="h-40 font-mono text-xs" 
                  placeholder="Paste calendar data here..."
                />
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {importSuccess && (
                  <Alert variant="default" className="bg-green-50 border-green-500 text-green-700">
                    <AlertDescription>Calendar data imported successfully!</AlertDescription>
                  </Alert>
                )}
                
                <Button onClick={handleImport} className="w-full">
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportModal;
