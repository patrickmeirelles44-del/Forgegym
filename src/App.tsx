import { useEffect, useRef, useState } from 'react'
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
  const streamRef = useRef<MediaStream | null>(null)
  const selected = exercises[activeExercise] ?? exercises[0]

  useEffect(() => () => { streamRef.current?.getTracks().forEach(track => track.stop()); if (importedImage) URL.revokeObjectURL(importedImage) }, [importedImage])

  async function startCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('A câmera precisa de um navegador compatível e endereço HTTPS.'); return }
    try {
      streamRef.current?.getTracks().forEach(track => track.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch { setCameraError('Não conseguimos abrir a câmera. Confira a permissão do navegador e tente novamente.') }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
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

      {screen === 'game' && <div className="page"><button className="back-link" onClick={() => setScreen(sessionStarted ? 'workout' : 'home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">MODO JOGO · PROTÓTIPO VISUAL</div><h1>Encontre seu <em>ritmo.</em></h1><p className="subhead">A ideia: acompanhar a ondulação com a bolinha durante cada repetição.</p><div className="game-layout"><section className="game-card"><div className="game-card-head"><div><span className="game-live"><span className="live-dot"/> SIMULAÇÃO VISUAL</span><h2>Controle o movimento</h2></div><span className="game-level">NÍVEL 01</span></div><div className="wave-stage"><div className="wave-grid"/><svg className="wave-svg" viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="Ondulação alvo"><defs><linearGradient id="waveLine" x1="0" x2="1"><stop offset="0%" stopColor="#8ba94e"/><stop offset="100%" stopColor="#d3ff79"/></linearGradient></defs><path d="M0 110 C58 10 117 10 175 110 S292 210 350 110 S467 10 525 110 S642 210 700 110" fill="none" stroke="url(#waveLine)" strokeWidth="5" strokeLinecap="round"/><path d="M0 110 C58 10 117 10 175 110 S292 210 350 110 S467 10 525 110 S642 210 700 110 L700 220 L0 220Z" fill="#c7f36b" opacity=".055"/></svg><div className="game-ball"/><div className="target-ball"/><span className="wave-label label-left">DESCE</span><span className="wave-label label-right">SOBE</span></div><div className="wave-legend"><span><i className="legend-dot target-dot"/> Ritmo-alvo</span><span><i className="legend-dot user-dot"/> Seu movimento</span></div><div className="game-stats"><div><span>CADÊNCIA</span><b>-- <small>rep/min</small></b></div><div><span>REPETIÇÕES</span><b>{done.length}</b></div><div><span>PRECISÃO</span><b>--%</b></div></div><div className="notice"><CircleHelp size={17}/><span>Esta bolinha é uma simulação de interface. Ainda não recebe dados reais da câmera nem do sensor Bluetooth.</span></div></section><section className="camera-card"><div className="camera-heading"><div><div className="eyebrow">VISÃO DO EXERCÍCIO</div><h2>Câmera</h2></div><span className={cameraOn ? 'camera-status active-status' : 'camera-status'}>{cameraOn ? 'ATIVA' : 'DESLIGADA'}</span></div><div className="camera-frame">{cameraOn ? <video ref={videoRef} autoPlay playsInline muted/> : <div className="camera-placeholder"><Camera size={32}/><b>Veja sua execução</b><span>Posicione o celular de forma segura para enquadrar o movimento.</span></div>}</div>{cameraError && <p className="error-text">{cameraError}</p>}<button className={cameraOn ? 'btn-secondary full-button' : 'btn-primary full-button'} onClick={cameraOn ? stopCamera : startCamera}>{cameraOn ? <><Pause size={16}/> Desligar câmera</> : <><Camera size={16}/> Ativar câmera</>}</button><p className="tiny-note">A câmera exibe o vídeo ao vivo; a detecção de pose e contagem automática ainda será implementada.</p><div className="sensor-mini"><Bluetooth size={19}/><div><b>Sensor da roldana</b><small>{sensorStatus === 'Pareado' ? sensorName+' · pareado' : 'Bluetooth · ainda não conectado'}</small></div><button className="icon-button" onClick={connectSensor}><ArrowRight size={17}/></button></div>{sensorMessage && <p className="tiny-note">{sensorMessage}</p>}</section></div><div className="game-footer"><button className="btn-secondary" onClick={() => setScreen('workout')}><ArrowLeft size={16}/> Voltar ao treino</button><button className="btn-primary" onClick={() => {setDone(old => selected && !old.includes(selected.id) ? [...old, selected.id] : old); setScreen('workout')}}><Check size={16}/> Concluir exercício</button></div></div>}

      {screen === 'profile' && <div className="page narrow-page"><button className="back-link" onClick={() => setScreen('home')}><ArrowLeft size={16}/> Voltar</button><div className="eyebrow">SEUS DADOS</div><h1>Seu ponto de <em>partida.</em></h1><p className="subhead">Informações locais para compor seu perfil de treino.</p><section className="form-panel"><label>Idade<input type="number" placeholder="Ex.: 28" value={age} onChange={e => setAge(e.target.value)}/></label><label>Altura (cm)<input type="number" placeholder="Ex.: 175" value={height} onChange={e => setHeight(e.target.value)}/></label><label>Peso (kg)<input type="number" placeholder="Ex.: 82" value={weight} onChange={e => setWeight(e.target.value)}/></label><div className="notice"><ShieldCheck size={17}/><span>Os dados ainda não são salvos em uma conta. A persistência será conectada quando definirmos o banco correto.</span></div><button className="btn-primary full-button" onClick={() => setScreen('home')}>Salvar nesta sessão <Check size={16}/></button></section></div>}
      <footer className="app-footer"><span>REPFORGE GYM</span><span>PROTÓTIPO EM EVOLUÇÃO · SEM DADOS PERSISTENTES</span></footer>
    </main>
    <nav className="mobile-nav"><button onClick={() => setScreen('home')} className={screen === 'home' ? 'mobile-active' : ''}><Activity size={17}/>Início</button><button onClick={() => setScreen('import')} className={screen === 'import' ? 'mobile-active' : ''}><FileImage size={17}/>Importar</button><button onClick={() => setScreen('workout')} className={screen === 'workout' ? 'mobile-active' : ''}><Dumbbell size={17}/>Treino</button><button onClick={() => setScreen('profile')} className={screen === 'profile' ? 'mobile-active' : ''}><UserRound size={17}/>Perfil</button></nav>
  </div>
}
