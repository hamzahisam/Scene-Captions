import bunny from "../../../data/captions/big-buck-bunny.json";
import sintel from "../../../data/captions/sintel.json";
import tears from "../../../data/captions/tears-of-steel.json";
import soar from "../../../data/source-assisted-captions/soar.json";
import hair from "../../../data/source-assisted-captions/hair-love.json";
import {Header} from '@/components/header';import {SessionSetup} from '@/components/session-setup';
export default function SessionPage(){return <><Header/><SessionSetup durations={Object.fromEntries([bunny,sintel,tears,soar,hair].map(f=>[f.video_id,f.duration_seconds]))}/></>}
