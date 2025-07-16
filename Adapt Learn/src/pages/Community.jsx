import React from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';

const PlaceholderPage = ({ title }) => {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "🚧 Page under construction",
      description: "This page isn't ready yet, but it's coming soon! 🚀",
    });
  };

  React.useEffect(() => {
    showToast();
  }, []);

  return (
    <>
      <Helmet>
        <title>{title} | LearnAI</title>
        <meta name="description" content={`Manage your ${title.toLowerCase()}.`} />
      </Helmet>
      <motion.div 
        className="flex flex-col items-center justify-center h-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-10 rounded-full bg-primary/10 mb-6">
            <img  class="w-32 h-32" alt="Group of people icon" src="https://images.unsplash.com/photo-1651372381086-9861c9c81db5" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          This section is currently under development. Check back soon for exciting new features to manage your {title.toLowerCase()}!
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </motion.div>
    </>
  );
};

const Community = () => <PlaceholderPage title="Community" />;

export default Community;