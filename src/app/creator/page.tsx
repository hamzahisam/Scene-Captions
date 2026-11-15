import { Header } from "@/components/header";
import { Creator } from "@/components/captune/creator";
import { loadDemo,demoSource } from "@/lib/captune/load-demo";
export default function Page(){return <div className="app-shell theme-paper"><Header page="creator"/><Creator initial={loadDemo()} source={demoSource()}/></div>;}
