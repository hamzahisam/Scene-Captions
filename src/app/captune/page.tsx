import { Header } from "@/components/header";
import { AnchoredViewer } from "@/components/captune/viewer";
import { loadDemo,demoSource } from "@/lib/captune/load-demo";
export default function Page(){return <><Header page="captune"/><AnchoredViewer initial={loadDemo()} source={demoSource()}/></>;}
