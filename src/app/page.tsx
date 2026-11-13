import bunnyAnnotations from "../../data/cue-annotations/big-buck-bunny.json";
import sintelAnnotations from "../../data/cue-annotations/sintel.json";
import tearsAnnotations from "../../data/cue-annotations/tears-of-steel.json";
import soarAnnotations from "../../data/cue-annotations/soar.json";
import hairAnnotations from "../../data/cue-annotations/hair-love.json";
import {validateAnnotations} from "@/lib/cue-annotations";
import bunny from "../../data/captions/big-buck-bunny.json";
import sintel from "../../data/captions/sintel.json";
import tears from "../../data/captions/tears-of-steel.json";
import simpleBunny from "../../data/source-assisted-captions/big-buck-bunny-controls.json";
import soar from "../../data/source-assisted-captions/soar.json";
import hairLove from "../../data/source-assisted-captions/hair-love.json";
import { videoSchema } from "@/lib/captions";
import { sourceAssistedTrackFor } from "@/lib/source-captions";
import { Header } from "@/components/header";
import { ScreeningRoom } from "@/components/screening-room";

function mediaSource(variable: string, localPath: string) {
  const configured = process.env[variable]?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "https:") throw new Error(`${variable} must be a public HTTPS video URL.`);
    return url.href;
  }
  if (process.env.VERCEL === "1") {
    throw new Error(`Set ${variable} to the hosted, caption-matched MP4 before deploying. Local video files are excluded from Git.`);
  }
  return localPath;
}

export default function Home() {
  const films = [
    { data: videoSchema.parse(bunny), sourceAssistedData: sourceAssistedTrackFor(videoSchema.parse(bunny), simpleBunny), source: mediaSource("DEMO_VIDEO_URL", "/media/big-buck-bunny.mp4"), poster: "/media/bunny-poster.jpg", credit: "Blender Foundation · 2008" },
    { data: videoSchema.parse(sintel), source: mediaSource("SINTEL_VIDEO_URL", "/media/sintel.mp4"), poster: "/media/sintel-poster.jpg", credit: "Blender Foundation · 2010" },
    { data: videoSchema.parse(tears), source: mediaSource("TEARS_OF_STEEL_VIDEO_URL", "/media/tears-of-steel.mp4"), poster: "/media/tears-of-steel-poster.jpg", credit: "Blender Foundation · 2012" },
    { data: videoSchema.parse(soar), source: "https://cis0lgq9buszb4na.public.blob.vercel-storage.com/films/soar.mp4", poster: "/media/soar-poster.jpg", credit: "Alyce Tzue · TheCGBros" },
    { data: videoSchema.parse(hairLove), source: "https://cis0lgq9buszb4na.public.blob.vercel-storage.com/films/hair-love.mp4", poster: "/media/hair-love-poster.jpg", credit: "Sony Pictures Animation · 2019" },
  ];
  return <><Header /><ScreeningRoom films={films.map(film=>({...film,annotations:validateAnnotations(film.sourceAssistedData||film.data,({"big-buck-bunny":bunnyAnnotations,"sintel":sintelAnnotations,"tears-of-steel":tearsAnnotations,"soar":soarAnnotations,"hair-love":hairAnnotations})[film.data.video_id as "big-buck-bunny"])}))} /></>;
}
