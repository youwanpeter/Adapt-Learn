import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, File, X, Loader2 } from 'lucide-react';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const Upload = () => {
    const { toast } = useToast();
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'image/jpeg': [],
            'image/png': [],
        }
    });

    const removeFile = (file) => {
        setFiles(files.filter(f => f !== file));
    };

    const handleProcessFiles = () => {
        if (files.length === 0) {
            toast({
                title: "No files selected",
                description: "Please upload at least one file to process.",
                variant: "destructive"
            });
            return;
        }
        setIsProcessing(true);
        toast({
            title: "🚀 Processing files...",
            description: "This feature isn't implemented yet, but your files are ready!",
        });
        setTimeout(() => {
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <>
            <Helmet>
                <title>Upload Documents | LearnAI</title>
                <meta name="description" content="Upload your course materials for processing." />
            </Helmet>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2 text-white">Upload Your Materials</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Drag and drop your documents here. We support PDF, DOCX, PPTX, and image files.
                    </p>
                </div>

                <Card className="glassmorphic-card max-w-3xl mx-auto">
                    <CardContent className="p-6">
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-300 ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary'}`}
                        >
                            <input {...getInputProps()} />
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="flex justify-center mb-4"
                            >
                                <UploadCloud className="w-16 h-16 text-primary" />
                            </motion.div>
                            {
                                isDragActive ?
                                    <p className="font-semibold">Drop the files here ...</p> :
                                    <p className="font-semibold">Drag 'n' drop some files here, or click to select files</p>
                            }
                            <p className="text-xs text-muted-foreground mt-2">Supported formats: PDF, DOCX, PPTX, JPG, PNG</p>
                        </div>
                    </CardContent>
                </Card>
                
                {files.length > 0 && (
                    <Card className="glassmorphic-card max-w-3xl mx-auto">
                        <CardHeader>
                            <CardTitle>Uploaded Files</CardTitle>
                            <CardDescription>Review your files before processing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {files.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <File className="w-5 h-5 flex-shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="font-medium truncate text-sm">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeFile(file)}>
                                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive"/>
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                            <Button className="w-full mt-6" onClick={handleProcessFiles} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isProcessing ? "Processing..." : `Process ${files.length} File(s)`}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </>
    );
};

export default Upload;