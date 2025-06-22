// src/components/ui/sidebar.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { PanelLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// --- Context and Hooks remain the same ---
const SIDEBAR_COOKIE_NAME="sidebar:state",SIDEBAR_COOKIE_MAX_AGE=60*60*24*7,SIDEBAR_WIDTH="16rem",SIDEBAR_WIDTH_MOBILE="18rem",SIDEBAR_WIDTH_ICON="4rem",SIDEBAR_KEYBOARD_SHORTCUT="b";type SidebarContext={state:"expanded"|"collapsed",open:boolean,setOpen:(open:boolean)=>void,openMobile:boolean,setOpenMobile:(open:boolean)=>void,isMobile:boolean,toggleSidebar:()=>void};const SidebarContext=React.createContext<SidebarContext|null>(null);function useSidebar(){const context=React.useContext(SidebarContext);if(!context){throw new Error("useSidebar must be used within a SidebarProvider.")}return context}
const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">&{defaultOpen?:boolean,open?:boolean,onOpenChange?:(open:boolean)=>void}>(({defaultOpen:defaultOpen=true,open:openProp,onOpenChange:setOpenProp,className,style,children,...props},ref)=>{const isMobile=useIsMobile();const[openMobile,setOpenMobile]=React.useState(false);const[_open,_setOpen]=React.useState(defaultOpen);const open=openProp??_open;const setOpen=React.useCallback((value:boolean|((value:boolean)=>boolean))=>{const openState=typeof value==="function"?value(open):value;if(setOpenProp){setOpenProp(openState)}else{_setOpen(openState)}document.cookie=`${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`},[setOpenProp,open]);const toggleSidebar=React.useCallback(()=>{return isMobile?setOpenMobile((open)=>!open):setOpen((open)=>!open)},[isMobile,setOpen,setOpenMobile]);React.useEffect(()=>{const handleKeyDown=(event:KeyboardEvent)=>{if(event.key===SIDEBAR_KEYBOARD_SHORTCUT&&(event.metaKey||event.ctrlKey)){event.preventDefault();toggleSidebar()}};window.addEventListener("keydown",handleKeyDown);return()=>window.removeEventListener("keydown",handleKeyDown)},[toggleSidebar]);const state=open?"expanded":"collapsed";const contextValue=React.useMemo<SidebarContext>(()=>({state,open,setOpen,isMobile,openMobile,setOpenMobile,toggleSidebar}),[state,open,setOpen,isMobile,openMobile,setOpenMobile,toggleSidebar]);return(<SidebarContext.Provider value={contextValue}><TooltipProvider delayDuration={0}><div style={{...style,"--sidebar-width":SIDEBAR_WIDTH,"--sidebar-width-icon":SIDEBAR_WIDTH_ICON}}className={cn("group/sidebar-wrapper flex min-h-svh w-full",className)}ref={ref}{...props}>{children}</div></TooltipProvider></SidebarContext.Provider>)});
SidebarProvider.displayName = "SidebarProvider"
const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { side?: "left" | "right" }>(({ side = "left", className, children, ...props }, ref ) => {const{isMobile,state,openMobile,setOpenMobile}=useSidebar();if(isMobile){return(<Sheet open={openMobile} onOpenChange={setOpenMobile}{...props}><SheetContent side={side}className="w-[--sidebar-width] bg-background/80 backdrop-blur-lg p-0 [&>button]:hidden"style={{"--sidebar-width":SIDEBAR_WIDTH_MOBILE}as React.CSSProperties}><div className="flex h-full w-full flex-col">{children}</div></SheetContent></Sheet>)}return(<div ref={ref}data-state={state}className={cn("hidden md:flex flex-col bg-background/50 backdrop-blur-xl border-r transition-[width] duration-300 ease-in-out",state==='expanded'?'w-[--sidebar-width]':'w-[--sidebar-width-icon]',className)}{...props}>{children}</div>)});
Sidebar.displayName = "Sidebar"
const SidebarTrigger = React.forwardRef<React.ElementRef<typeof Button>, React.ComponentProps<typeof Button>>(({ className, ...props }, ref) => {const{toggleSidebar}=useSidebar();return(<Button ref={ref}variant="ghost"size="icon"className={cn("h-8 w-8",className)}onClick={toggleSidebar}{...props}><PanelLeft /><span className="sr-only">Toggle Sidebar</span></Button>)});
SidebarTrigger.displayName = "SidebarTrigger"
const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {const{state}=useSidebar();return(<div ref={ref}className={cn("flex items-center p-4 h-16",state==='collapsed'&&'justify-center',className)}{...props}/>)});
SidebarHeader.displayName = "SidebarHeader"
const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {return(<div ref={ref}className={cn("flex-1 overflow-y-auto overflow-x-hidden",className)}{...props}/>)});
SidebarContent.displayName = "SidebarContent"
const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => {return(<div ref={ref}className={cn("mt-auto",className)}{...props}/>)});
SidebarFooter.displayName = "SidebarFooter"
const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (<ul ref={ref}className={cn("flex flex-col gap-1 py-2",className)}{...props}/>));
SidebarMenu.displayName = "SidebarMenu"
const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (<li ref={ref}className={cn("relative",className)}{...props}/>));
SidebarMenuItem.displayName = "SidebarMenuItem"


// UPDATED: SidebarGroup to support an icon
const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { label: string; icon?: React.ElementType }
>(({ className, label, icon: Icon, children, ...props }, ref) => {
    const { state } = useSidebar();
    return (
        <div ref={ref} className={cn("p-2", className)} {...props}>
            <p className={cn(
                "px-2 text-sm font-semibold text-muted-foreground tracking-wider transition-opacity duration-300 flex items-center gap-2",
                state === 'collapsed' ? 'opacity-0 h-0' : 'opacity-100 h-auto'
            )}>
                {Icon && <Icon className="h-4 w-4" />}
                <span>{label}</span>
            </p>
            {children}
        </div>
    )
})
SidebarGroup.displayName = "SidebarGroup"

// UPDATED: SidebarMenuButton to support a highlight prop
const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean; tooltip?: string; highlight?: boolean; }
>(
  (
    { asChild = false, isActive = false, tooltip, highlight = false, className, children, ...props },
    ref
  ) => {
    const { state } = useSidebar();
    const Comp = asChild ? Slot : "button";

    const buttonContent = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(
          "relative flex items-center gap-3 w-full h-11 px-3 rounded-lg outline-none transition-all duration-200",
          "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
          isActive 
            ? "bg-primary/10 text-primary font-semibold shadow-inner" 
            : "text-muted-foreground hover:text-foreground",
          highlight && !isActive && "text-primary bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:text-primary",
          state === 'collapsed' && "justify-center",
          className
        )}
        {...props}
      >
        <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 rounded-r-full bg-primary transition-all duration-200",
            isActive && "h-6"
        )} />
        {children}
      </Comp>
    );

    if (state === 'collapsed') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side="right" align="center">{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
}