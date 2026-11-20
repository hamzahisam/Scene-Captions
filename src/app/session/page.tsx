import bunny from "../../../data/captions/big-buck-bunny.json";
import soar from "../../../data/source-assisted-captions/soar.json";
import hair from "../../../data/source-assisted-captions/hair-love.json";
import {Header} from '@/components/header';import {SessionSetup} from '@/components/session-setup';
export default function SessionPage(){return <><Header/><SessionSetup durations={Object.fromEntries([bunny,soar,hair].map(f=>[f.video_id,f.duration_seconds]))}/></>}
