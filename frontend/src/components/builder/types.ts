import { ReactNode } from "react";

export type DeviceMode = "desktop" | "mobile";

export type BlockType = 
  | "hero" 
  | "features" 
  | "rich-text" 
  | "curriculum" 
  | "instructor" 
  | "testimonials" 
  | "pricing" 
  | "stats"
  | "trust"
  | "faq";

export interface StandardSpacing {
  paddingTop?: number;
  paddingBottom?: number;
  marginTop?: number;
  marginBottom?: number;
}

export interface BuilderBlock {
  id: string; 
  type: BlockType;
  content: Record<string, any>; 
  styles: Record<string, any> & StandardSpacing & { 
    themeVariant?: "default" | "glass" | "outline" | "solid" | "minimal";
    animation?: "fade" | "slide-up" | "slide-left" | "slide-right" | "zoom" | "none";
    dividerTop?: "wave" | "curve" | "none";
    dividerBottom?: "wave" | "curve" | "none";
    backgroundType?: "color" | "gradient" | "glass" | "image";
    backgroundValue?: string;
    textAlign?: "left" | "center" | "right";
    headingSize?: "sm" | "md" | "lg" | "xl" | "2xl";
    headingWeight?: "normal" | "bold" | "black";
  }; 
}

export interface BlockDefinition {
  type: BlockType;
  name: string;
  description: string;
  icon: React.ElementType;
  defaultContent: Record<string, any>;
  defaultStyles: Record<string, any>;
  component: React.FC<{ block: BuilderBlock }>;
  settingsComponent: React.FC<{ block: BuilderBlock; updateBlock: (id: string, updates: Partial<BuilderBlock>) => void }>;
}
