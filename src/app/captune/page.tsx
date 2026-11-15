import { Header } from "@/components/header";
import { AnchoredViewer } from "@/components/captune/viewer";
import { loadDemo,demoSource } from "@/lib/captune/load-demo";
export default function Page(){return <div className="app-shell theme-paper"><Header page="captune"/><AnchoredViewer initial={loadDemo()} source={demoSource()}/></div>;}
