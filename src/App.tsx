import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { Activity, ArrowLeft, ArrowRight, Bluetooth, Camera, Check, ChevronRight, CircleHelp, Dumbbell, FileImage, Gamepad2, ListChecks, Pause, Play, Plus, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, Upload, UserRound, Waves, Zap } from 'lucide-react'

type Exercise = { id: number; name: string; muscle: string; sets: number; reps: string; load: string }
type BluetoothDeviceLike = { name?: string; gatt?: { connect: () => Promise<unknown>; disconnect: () => void } }
type NavigatorBluetooth = Navigator & { bluetooth?: { requestDevice: (options: { acceptAllDevices: boolean }) => Promise<BluetoothDeviceLike> } }

const starterExercises: Exercise[] = [
  { id: 1, name: 'Agachamento livre', muscle: 'Pernas', sets: 4, reps: '8–10', load: '' },
  { id: 2, name: 'Supino reto', muscle: 'Peito', sets: 4, reps: '8–12', load: '' },
  { id: 3, name: 'Remada curvada', muscle: 'Costas', sets: 3, reps: '10–12', load: '' },
]

type Screen = 'home' | 'import' | 'build' | 'free' | 'workout' | 'game' | 'profile'
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [exercises, setExercises] = useState<Exercise[]>(starterExercises)
  const [workoutName, setWorkoutName] = useState('Treino A · Corpo inteiro')
  const [activeExercise, setActiveExercise] = useState(0)
  const [done, setDone] = useState<number[]>([])
  const [fileName, setFileName] = useState('')
  const [importedImage, setImportedImage] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [sensorStatus, setSensorStatus] = useState('Não conectado')
  const [sensorName, setSensorName] = useState('')
  const [sensorMessage, setSensorMessage] = useState('')
  const [goal, setGoal] = useState('Hipertrofia')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<PoseLandmarker | null>(null)
  const frameRef = useRef<number>(0)
  const lastRepState = useRef<'up' | 'down'>('up')
  const [poseReady, setPoseReady] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [calibrationCount, setCalibrationCount] = useState(0)
  const [reps, setReps] = useState(0)
  const [cadence, setCadence] = useState(0)
  const [formQuality, setFormQuality] = useState('--')
  const [poseMessage, setPoseMessage] = useState('Ative a câmera para iniciar a visão computacional.')
  const [ballY, setBallY] = useState(50)
  const [targetY, setTargetY] = useState(50)
  const selected = exercises[activeExercise] ?? exercises[0]

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    poseRef.current?.close()
    if (importedImage) URL.revokeObjectURL(importedImage)
  }, [importedImage])

  async function startCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('A câmera precisa de um navegador compatível e endereço HTTPS.'); return }
    try {
      streamRef.current?.getTracks().forEach(track => track.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      setPoseMessage('Carregando modelo de visão computacional…')
      try {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm')
        poseRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'GPU' },
          runningMode: 'VIDEO', numPoses: 1
        })
        setPoseReady(true)
        setPoseMessage('Modelo ativo. Posicione o corpo inteiro no enquadramento e calibre.')
        runPoseLoop()
      } catch {
        setPoseMessage('Não foi possível carregar o modelo. Confira a internet e recarregue a tela.')
      }
    } catch { setCameraError('Não conseguimos abrir a câmera. Confira a permissão do navegador e tente novamente.') }
  }
  function runPoseLoop() {
    const loop = () => {
      const video = videoRef.current
      const canvas = overlayRef.current
      const pose = poseRef.current
      if (!video || !canvas || !pose || video.readyState < 2) {
        frameRef.current = requestAnimationFrame(loop)
        return
      }
      const result = pose.detectForVideo(video, performance.now())
      const ctx = canvas.getContext('2d')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      const landmarks = result.landmarks?.[0]
      if (landmarks && ctx) {
        const points = [11,12,13,14,15,16,23,24,25,26,27,28]
        ctx.strokeStyle = '#c8f477'; ctx.lineWidth = Math.max(2, canvas.width / 240)
        const links = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]]
        links.forEach(([a,b]) => {
          const pa = landmarks[a], pb = landmarks[b]
          if (pa.visibility > .45 && pb.visibility > .45) {
            ctx.beginPath(); ctx.moveTo(pa.x*canvas.width,pa.y*canvas.height); ctx.lineTo(pb.x*canvas.width,pb.y*canvas.height); ctx.stroke()
          }
        })
        points.forEach(i => {
          const p = landmarks[i]
          if (p.visibility > .45) { ctx.beginPath(); ctx.arc(p.x*canvas.width,p.y*canvas.height,canvas.width/100,0,Math.PI*2); ctx.fillStyle='#e8ffb6'; ctx.fill() }
        })
        const hip = (landmarks[23].y + landmarks[24].y)/2
        const knee = (landmarks[25].y + landmarks[26].y)/2
        const ankle = (landmarks[27].y + landmarks[28].y)/2
        const visible = [23,24,25,26,27,28].every(i => landmarks[i].visibility > .45)
        if (visible) {
          const relative = Math.max(0, Math.min(1, (hip-knee+0.02) / Math.max(.12, ankle-knee)))
          setBallY(Math.max(8, Math.min(92, 15 + relative*70)))
          setFormQuality(relative > .22 && relative < .9 ? 'Boa' : 'Ajustar')
          if (calibrated) {
            const isDown = hip > knee - .02
            if (isDown && lastRepState.current === 'up') lastRepState.current = 'down'
            else if (!isDown && lastRepState.current === 'down') { lastRepState.current = 'up'; setReps(n => n+1); setCadence(n => Math.min(99, n+1)) }
          }
        }
      }
      frameRef.current = requestAnimationFrame(loop)
    }
    cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(loop)
  }
  function calibratePose() {
    if (!poseReady) { setPoseMessage('Ative a câmera e aguarde o modelo carregar.'); return }
    setCalibrated(false)
    setCalibrationCount(0)
    setPoseMessage('Calibrando… fique na posição inicial e faça 3 movimentos lentos.')
    let count = 0
    const tick = () => {
      count += 1
      setCalibrationCount(count)
      if (count >= 3) {
        setCalibrated(true)
        setReps(0)
        lastRepState.current = 'up'
        setPoseMessage('Calibração inicial concluída. A contagem é experimental e pode errar; use o corpo inteiro visível.')
      } else window.setTimeout(tick, 900)
    }
    window.setTimeout(tick, 900)
  }
  function stopCamera() {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    poseRef.current?.close()
    poseRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false); setPoseReady(false); setCalibrated(false)
    setPoseMessage('Câmera desligada.')
  }
  async function connectSensor() {
    const bluetooth = (navigator as NavigatorBluetooth).bluetooth
    if (!bluetooth) { setSensorMessage('Este navegador não oferece Bluetooth BLE para páginas web. No iPhone, a conexão direta pelo navegador normalmente não é suportada; podemos usar Android compatível ou criar um app nativo depois.'); return }
    try {
      setSensorMessage('Selecione o sensor na janela do navegador.')
      const device = await bluetooth.requestDevice({ acceptAllDevices: true })
      if (device.gatt) await device.gatt.connect()
      setSensorName(device.name || 'Sensor Bluetooth')
      setSensorStatus('Pareado')
      setSensorMessage('Dispositivo encontrado. Para receber repetições e cadência, ainda precisamos definir o protocolo Bluetooth do ESP32.')
    } catch { setSensorMessage('Conexão cancelada ou indisponível. Confira se o sensor está ligado e próximo do aparelho.') }
  }
  function addExercise() {
    const name = prompt('Nome do exercício:')
    if (!name?.trim()) return
    setExercises(old => [...old, { id: Date.now(), name: name.trim(), muscle: 'Personalizado', sets: 3, reps: '10–12', load: '' }])
  }
  function chooseFile(file?: File) {
    if (!file) return
    if (importedImage) URL.revokeObjectURL(importedImage)
    setImportedImage(URL.createObjectURL(file))
    setFileName(file.name)
  }
  function beginWorkout() {
    setDone([])
    setActiveExercise(0)
    setSessionStarted(true)
    setScreen('workout')
  }
  function finishSet() {
    if (!selected) return
    setDone(old => old.includes(selected.id) ? old : [...old, selected.id])
    if (activeExercise < exercises.length - 1) setActiveExercise(activeExercise + 1)
    else setScreen('game')
  }
  const xp = 120 + done.length * 30

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setScreen('home')}><span className="brand-mark"><Zap size={19} fill="currentColor"/></span><span>REP<span className="brand-light">FORGE</span><small>GYM SYSTEM</small></span></button>
      <div className="side-label">TREINO</div>
      <button className={screen === 'home' ? 'side-link active' : 'side-link'} onClick={() => setScreen('home')}><Activity/> Visão geral</button>
      <button className={['workout','game'].includes(screen) ? 'side-link active' : 'side-link'} onClick={() => setScreen('workout')}><Dumbbell/> Meu treino</button>
      <button className={screen === 'profile' ? 'side-link active' : 'side-link'} onClick={() => setScreen('profile')}><UserRound/> Meu perfil</button>
      <div className="sidebar-bottom"><div className="level-icon"><Trophy size={17}/></div><div><b>Nível 01 · Iniciante</b><small>{xp} XP acumulados</small></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-brand" onClick={() => setScreen('home')}> <Zap size={18} fill="currentColor"/> REP<span>FORGE</span></button>
        <div className="top-context"><span className="live-dot"/> SEU TREINO, DO SEU JEITO</div>
        <div className="top-xp"><Sparkles size={15}/>{xp} XP</div>
      </header>

      {screen === 'home' && <div className="page">
        <div className="welcome-row"><div><div className="eyebrow">VAMOS EVOLUIR</div><h1>Seu treino começa <em>aqui.</em></h1><p className="subhead">Traga sua ficha. O RepForge organiza o resto.</p></div><div className="date-chip"><Activity size={16}/><span>SESSÃO DE TREINO</span></div></div>
        <section className="home-hero"><div className="hero-copy"><div className="hero-chip"><Target size={14}/> SEU PRÓXIMO NÍVEL</div><h2>Treine com propósito.<br/><em>Jogue para evoluir.</em></h2><p>Use seu treino atual, acompanhe cada repetição e transforme consistência em progresso.</p><button className="btn-primary" onClick={() => setScreen('import')}>Importar minha ficha <ArrowRight size={17}/></button></div><div className="hero-art"><div className="ring ring-one"/><div className="ring ring-two"/><div className="hero-glyph"><Waves size={68}/></div><div className="floating-stat"><span className="stat-pulse"/><span><b>SEU RITMO</b><small>Em construção</small></span></div></div></section>
        <div className="section-heading"><div><div className="eyebrow">ESCOLHA COMO COMEÇAR</div><h2>Qual é o seu caminho?</h2></div><span className="quiet">3 OPÇÕES</span></div>
        <section className="start-options">
          <button className="option-card option-featured" onClick={() => setScreen('import')}><span className="option-icon"><FileImage size={22}/></span><span className="option-tag">RECOMENDADO</span><b>Importar meu treino</b><p>Envie uma foto ou print da ficha que já usa na academia.</p><span className="option-action">Usar minha ficha <ChevronRight size={16}/></span></button>
          <button className="option-card" onClick={() => setScreen('build')}><span className="option-icon"><ListChecks size={22}/></span><b>Montar meu treino</b><p>Organize uma rotina por objetivo, dias e exercícios.</p><span className="option-action">Montar agora <ChevronRight size={16}/></span></button>
          <button className="option-card" onClick={() => setScreen('free')}><span className="option-icon"><Gamepad2 size={22}/></span><b>Treino livre</b><p>Para quem já sabe o que fazer e quer registrar a sessão.</p><span className="option-action">Começar livre <ChevronRight size={16}/></span></button>
        </section>
        <section className="bottom-grid"><div className="mini-panel"><div className="panel-icon"><Bluetooth size={19}/></div><div className="mini-panel-content"><b>Sensor da roldana</b><p>O plano é medir o movimento e enviar os dados ao app por Bluetooth.</p><button className="text-action" onClick={() => setScreen('game')}>Ver experiência de jogo <ArrowRight size={15}/></button></div><span className="status-pill">EM DESENVOLVIMENTO</span></div><div className="mini-panel"><div className="panel-icon"><Camera size={19}/></div><div className="mini-panel-content"><b>Câmera inteligente</b><p>Primeiro vamos validar o movimento com a câmera, antes do sensor físico.</p><button className="text-action" onClick={() => setScreen('game')}>Testar conceito <ArrowRight size={15}/></button></div></div></section>
      </div>}

      {screen === 'import' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">PASSO 01 · TRAGA SUA ROTINA</div><h1>Importe sua <em>ficha.</em></h1><p className="subhead">Pode ser foto da ficha de papel ou print do app da sua academia.</p><label className="upload-zone">{importedImage ? <img className="upload-preview" src={importedImage} alt="Prévia da ficha selecionada"/> : <span className="upload-icon"><Upload size={26}/></span>}<b>{fileName || 'Escolher foto ou captura de tela'}</b><span>JPG, PNG ou imagem do celular</span><input type="file" accept="image/*" onChange={e => chooseFile(e.target.files?.[0])}/></label>{fileName && <div className="notice"><CircleHelp size={17}/><span>A imagem foi carregada. A leitura automática por IA/OCR ainda não está conectada; por enquanto, confira e monte os exercícios abaixo manualmente.</span></div>}<div className="section-heading compact"><div><div className="eyebrow">OU COMECE PELO EXEMPLO</div><h2>Ficha para organizar</h2></div><span className="quiet">{exercises.length} exercícios</span></div><div className="exercise-list">{exercises.map((e,i)=><div className="exercise-row" key={e.id}><span className="exercise-index">{String(i+1).padStart(2,'0')}</span><div className="exercise-main"><b>{e.name}</b><small>{e.muscle} · {e.sets} séries · {e.reps} reps</small></div><button className="icon-button" aria-label="Remover exercício" onClick={() => setExercises(old => old.filter(item => item.id !== e.id))}>×</button></div>)}</div><button className="btn-secondary full-button" onClick={addExercise}><Plus size={16}/> Adicionar exercício manualmente</button><button className="btn-primary full-button" onClick={() => {setWorkoutName('Minha ficha importada'); setScreen('workout')}}>Conferir e iniciar treino <ArrowRight size={17}/></button></div>}

      {screen === 'build' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">MONTE SUA ROTINA</div><h1>Seu plano, <em>suas regras.</em></h1><p className="subhead">Comece com uma estrutura simples. Você pode editar os exercícios depois.</p><section className="form-panel"><label>Qual é seu objetivo?<select value={goal} onChange={e => setGoal(e.target.value)}><option>Hipertrofia</option><option>Força</option><option>Condicionamento</option><option>Voltar a treinar</option></select></label><label>Quantos dias por semana?<select><option>3 dias</option><option>2 dias</option><option>4 dias</option><option>5 dias</option><option>6 dias</option></select></label><label>Experiência<select><option>Intermediário</option><option>Iniciante</option><option>Avançado</option></select></label><div className="notice"><ShieldCheck size={17}/><span>Esta versão ainda não gera prescrição personalizada automaticamente. Vamos usar a lista inicial como base editável, sem substituir a orientação profissional.</span></div><button className="btn-primary full-button" onClick={() => {setWorkoutName('Plano · '+goal); setScreen('workout')}}>Criar estrutura inicial <ArrowRight size={17}/></button></section></div>}

      {screen === 'free' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">SEM PLANO FIXO</div><h1>Treino <em>livre.</em></h1><p className="subhead">Adicione só os exercícios que vai fazer hoje.</p><section className="form-panel"><div className="exercise-list">{exercises.map((e,i)=><div className="exercise-row" key={e.id}><span className="exercise-index">{String(i+1).padStart(2,'0')}</span><div className="exercise-main"><b>{e.name}</b><small>{e.muscle} · {e.sets} séries · {e.reps} reps</small></div><button className="icon-button" onClick={() => setExercises(old => old.filter(item => item.id !== e.id))}>×</button></div>)}</div><button className="btn-secondary full-button" onClick={addExercise}><Plus size={16}/> Adicionar exercício</button><button className="btn-primary full-button" onClick={() => {setWorkoutName('Treino livre'); beginWorkout()}}>Iniciar sessão <Play size={16}/></button></section></div>}

      {screen === 'workout' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar ao início</button><div className="eyebrow">SESSÃO ATUAL</div><h1>{workoutName.split(' · ')[0]} <em>{workoutName.includes(' · ') ? workoutName.split(' · ').slice(1).join(' · ') : ''}</em></h1><p className="subhead">Um exercício por vez. Registre a execução e acompanhe seu ritmo.</p><div className="session-progress"><div><span>PROGRESSO DA SESSÃO</span><b>{done.length}/{exercises.length}</b></div><div className="progress-track"><span style={{width: (done.length/Math.max(exercises.length,1)*100)+'%'}}/></div></div>{selected ? <section className="active-exercise"><div className="active-exercise-top"><span className="quiet">EXERCÍCIO {activeExercise+1} DE {exercises.length}</span><span className="exercise-chip">{selected.muscle}</span></div><h2>{selected.name}</h2><p>{selected.sets} séries · {selected.reps} repetições {selected.load ? '· '+selected.load : ''}</p><div className="rep-count"><div><span>REPETIÇÕES-ALVO</span><strong>{selected.reps}</strong></div><div><span>SÉRIES</span><strong>{selected.sets}</strong></div></div><button className="btn-primary full-button" onClick={() => setScreen('game')}><Gamepad2 size={17}/> Abrir modo jogo</button><button className="btn-secondary full-button" onClick={finishSet}><Check size={17}/> {activeExercise < exercises.length-1 ? 'Concluir exercício e avançar' : 'Concluir treino'}</button><button className="text-action centered" onClick={addExercise}><Plus size={15}/> Adicionar outro exercício</button></section> : <section className="form-panel"><b>Treino sem exercícios</b><p>Adicione exercícios para começar sua sessão.</p><button className="btn-primary" onClick={addExercise}>Adicionar exercício</button></section>}<section className="sensor-strip"><div className="panel-icon"><Bluetooth size={19}/></div><div className="mini-panel-content"><b>Sensor da roldana</b><p>{sensorStatus === 'Pareado' ? sensorName+' pareado' : 'Ainda não conectado'}</p></div><button className="btn-secondary" onClick={connectSensor}>Conectar</button></section>{sensorMessage && <div className="notice"><Bluetooth size={17}/><span>{sensorMessage}</span></div>}</div>}

      {screen === 'game' && <div className="game-fullscreen">
        <div className="game-topline"><button className="game-back" onClick={() => {stopCamera(); setScreen(sessionStarted ? 'workout' : 'home')}}><ArrowLeft size={17}/> SAIR DO MODO JOGO</button><div className="game-live"><span className="live-dot"/> {poseReady ? 'VISÃO COMPUTACIONAL ATIVA' : 'MODO DE TREINO'}</div><div className="game-top-xp"><Sparkles size={14}/> {xp} XP</div></div>
        <div className="full-game-content">
          <div className="game-title-block"><div className="eyebrow">REPFORGE · CADÊNCIA EM TEMPO REAL</div><h1>Encontre seu <em>ritmo.</em></h1><p>A bolinha responde ao movimento detectado pela câmera. Calibre antes de começar.</p></div>
          <section className="live-wave-panel">
            <div className="live-wave-head"><div><span className="wave-overline">ALVO DE MOVIMENTO</span><h2>{selected?.name || 'Movimento livre'}</h2></div><span className={calibrated ? 'calibration-pill calibrated' : 'calibration-pill'}>{calibrated ? 'CALIBRADO' : 'PRECISA CALIBRAR'}</span></div>
            <div className="live-wave-stage"><div className="wave-grid"/><svg className="live-wave-svg" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-label="Ondulação de cadência"><defs><linearGradient id="liveWaveGradient" x1="0" x2="1"><stop offset="0%" stopColor="#7d9d47"/><stop offset="100%" stopColor="#d8ff8d"/></linearGradient></defs><path d="M0 150 C83 10 167 10 250 150 S417 290 500 150 S667 10 750 150 S917 290 1000 150" fill="none" stroke="url(#liveWaveGradient)" strokeWidth="5" strokeLinecap="round"/><path d="M0 150 C83 10 167 10 250 150 S417 290 500 150 S667 10 750 150 S917 290 1000 150 L1000 300 L0 300Z" fill="#c8f477" opacity=".06"/></svg><div className="wave-centerline"/><div className="vision-ball" style={{top:ballY+'%'}}/><div className="wave-target" style={{top:targetY+'%'}}/><span className="wave-label label-left">CONCÊNTRICA</span><span className="wave-label label-right">EXCÊNTRICA</span><div className="wave-position-label" style={{top:ballY+'%'}}>MOVIMENTO DETECTADO</div></div>
            <div className="live-metrics"><div><span>REPETIÇÕES</span><b>{reps}</b></div><div><span>CADÊNCIA</span><b>{cadence} <small>ciclos</small></b></div><div><span>POSTURA</span><b className={formQuality === 'Boa' ? 'metric-good' : ''}>{poseReady ? formQuality : '--'}</b></div><div><span>CALIBRAGEM</span><b>{calibrated ? '100%' : calibrationCount+'/3'}</b></div></div>
            <div className="game-controls"><button className="btn-primary" onClick={calibratePose}><Target size={17}/> {calibrated ? 'Recalibrar' : 'Calibrar câmera'}</button><button className="btn-secondary" onClick={() => {setReps(0);setCadence(0);lastRepState.current='up';setTargetY(50)}}><RotateCcw size={16}/> Reiniciar</button><button className={cameraOn ? 'btn-secondary' : 'btn-primary'} onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? <><Pause size={16}/> Desligar câmera</> : <><Camera size={16}/> Ativar câmera</>}</button></div>
            <p className="vision-status"><span className={poseReady ? 'live-dot' : 'status-dot'}/>{poseMessage}</p>
          </section>
          <aside className="floating-camera"><div className="floating-camera-header"><div><span className="camera-rec-dot"/><b>VISÃO DO EXERCÍCIO</b></div><span>{poseReady ? 'AO VIVO' : 'CÂMERA'}</span></div><div className="floating-video-wrap">{cameraOn ? <><video ref={videoRef} autoPlay playsInline muted/><canvas ref={overlayRef} className="pose-overlay"/></> : <div className="camera-placeholder"><Camera size={31}/><b>Câmera do atleta</b><span>Ative para detectar o movimento e atualizar o game.</span></div>}<div className="camera-corner-label">CORPO INTEIRO NO QUADRO</div></div><div className="floating-camera-bottom"><span><span className={poseReady ? 'live-dot' : 'status-dot'}/>{poseReady ? 'Pose detectada pelo modelo' : 'Aguardando câmera'}</span><button onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? 'Desligar' : 'Ativar'}</button></div></aside>
        </div>
        <div className="game-disclaimer"><ShieldCheck size={14}/> Protótipo experimental: a detecção e contagem podem falhar. Não substitui orientação profissional nem avaliação de segurança.</div>
      </div>}
      {screen === 'profile' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">SEUS DADOS</div><h1>Seu ponto de <em>partida.</em></h1><p className="subhead">Informações locais para compor seu perfil de treino.</p><section className="form-panel"><label>Idade<input type="number" placeholder="Ex.: 28" value={age} onChange={e => setAge(e.target.value)}/></label><label>Altura (cm)<input type="number" placeholder="Ex.: 175" value={height} onChange={e => setHeight(e.target.value)}/></label><label>Peso (kg)<input type="number" placeholder="Ex.: 82" value={weight} onChange={e => setWeight(e.target.value)}/></label><div className="notice"><ShieldCheck size={17}/><span>Os dados ainda não são salvos em uma conta. A persistência será conectada quando definirmos o banco correto.</span></div><button className="btn-primary full-button" onClick={() => setScreen('home')}>Salvar nesta sessão <Check size={16}/></button></section></div>}
      <footer className="app-footer"><span>REPFORGE GYM</span><span>PROTÓTIPO EM EVOLUÇÃO · SEM DADOS PERSISTENTES</span></footer>
    </main>
    <nav className="mobile-nav"><button onClick={() => setScreen('home')} className={screen === 'home' ? 'mobile-active' : ''}><Activity size={17}/>Início</button><button onClick={() => setScreen('import')} className={screen === 'import' ? 'mobile-active' : ''}><FileImage size={17}/>Importar</button><button onClick={() => setScreen('workout')} className={screen === 'workout' ? 'mobile-active' : ''}><Dumbbell size={17}/>Treino</button><button onClick={() => setScreen('profile')} className={screen === 'profile' ? 'mobile-active' : ''}><UserRound size={17}/>Perfil</button></nav>
  </div>
}
