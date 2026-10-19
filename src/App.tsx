import { useState } from 'react'
import { Activity, Camera, Check, Dumbbell, Flame, Play, Plus, Sparkles, Target, Trophy, UserRound, Zap } from 'lucide-react'

type Exercise = { name: string; muscle: string; sets: number; reps: string }
const initial: Exercise[] = [
  { name: 'Agachamento livre', muscle: 'Pernas', sets: 4, reps: '8–10' },
  { name: 'Supino reto', muscle: 'Peito', sets: 4, reps: '8–12' },
  { name: 'Remada curvada', muscle: 'Costas', sets: 3, reps: '10–12' },
]
export default function App() {
  const [tab, setTab] = useState('Hoje')
  const [goal, setGoal] = useState('Força total')
  const [exercises, setExercises] = useState(initial)
  const [done, setDone] = useState<string[]>([])
  const [camera, setCamera] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  async function testCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error()
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      stream.getTracks().forEach(t => t.stop())
      setCamera(true)
    } catch { alert('Não foi possível acessar a câmera. Confira a permissão e use HTTPS.') }
  }
  function addExercise() {
    const name = prompt('Nome do exercício:')
    if (name?.trim()) setExercises(old => [...old, { name: name.trim(), muscle: 'Personalizado', sets: 3, reps: '10–12' }])
  }
  return <div className="shell">
    <aside className="side"><div className="logo"><Zap fill="currentColor"/> REP<span>FORGE</span></div><p className="label">SEU ESPAÇO</p>{['Hoje','Treinos','Progresso','Perfil'].map(t=><button key={t} className={tab===t?'nav active':'nav'} onClick={()=>setTab(t)}>{t==='Hoje'?<Activity/>:t==='Treinos'?<Dumbbell/>:t==='Progresso'?<Trophy/>:<UserRound/>}{t}</button>)}<div className="level"><Trophy/><div><b>Nível 01</b><small>Comece sua jornada</small></div></div></aside>
    <main><header><b className="mobile-logo">REP<span>FORGE</span></b><span className="kicker">SEU TREINO. SUA EVOLUÇÃO.</span><span className="xp"><Sparkles size={15}/> {120+done.length*30} XP</span></header>
    {tab==='Hoje'&&<><section className="welcome"><div><p className="label">PAINEL DE TREINO</p><h1>Construa sua <em>força.</em></h1><p className="muted">Consistência vence motivação. Vamos trabalhar.</p></div><div className="streak"><Flame/> <b>0 dias</b><small>Sequência atual</small></div></section><section className="hero"><div className="hero-text"><span className="tag"><Target size={14}/> MISSÃO DE HOJE</span><h2>O próximo nível<br/>é conquistado.</h2><p>Complete seu treino, acumule XP e acompanhe sua evolução sessão após sessão.</p><button className="primary" onClick={()=>setTab('Treinos')}><Play size={16} fill="currentColor"/> Começar treino →</button></div><div className="orbit"><div>01</div></div></section><div className="section-title"><div><p className="label">RESUMO</p><h2>Seu ritmo</h2></div><span className="muted">ESTA SEMANA</span></div><section className="stats"><Stat icon={<Zap/>} title="XP acumulado" value={String(120+done.length*30)} note="Continue evoluindo"/><Stat icon={<Dumbbell/>} title="Exercícios feitos" value={String(done.length)} note="Nesta sessão"/><Stat icon={<Trophy/>} title="Meta de hoje" value={done.length===exercises.length?'100%':Math.round(done.length/Math.max(exercises.length,1)*100)+'%'} note="Treino concluído"/></section><section className="panels"><div className="panel"><p className="label">PRÓXIMO PASSO</p><h3>Treino recomendado</h3><div className="row"><Dumbbell/><div><b>{goal}</b><small>{exercises.length} exercícios • ritmo controlado</small></div><button className="secondary" onClick={()=>setTab('Treinos')}>Abrir →</button></div></div><div className="panel"><Camera/><p className="label">TESTE DE MOVIMENTO</p><h3>Validar com a câmera</h3><p className="muted">Teste de permissão antes de desenvolver a análise de pose.</p><button className="secondary" onClick={testCamera}>Testar câmera</button>{camera&&<p className="success"><Check size={14}/> Câmera acessível; análise de pose ainda não conectada.</p>}</div></section></>}
    {tab==='Treinos'&&<><p className="label">CENTRAL DE TREINO</p><h1>Treino <em>em ação.</em></h1><p className="muted">Escolha seu objetivo e personalize os exercícios.</p><section className="panel workout"><h3>Objetivo do treino</h3><div className="goals">{['Força total','Hipertrofia','Condicionamento'].map(g=><button className={goal===g?'goal chosen':'goal'} key={g} onClick={()=>setGoal(g)}>{g}</button>)}</div><div className="work-title"><h2>{goal}</h2><button className="secondary" onClick={addExercise}><Plus size={15}/> Adicionar exercício</button></div><div className="bar"><span style={{width:(done.length/Math.max(exercises.length,1)*100)+'%'}}/></div><p className="muted">{done.length} de {exercises.length} exercícios concluídos</p>{exercises.map((e,i)=><article className="exercise" key={e.name+i}><span className="number">{String(i+1).padStart(2,'0')}</span><div className="grow"><b>{e.name}</b><small>{e.muscle} • {e.sets} séries • {e.reps} reps</small></div><button className={done.includes(e.name)?'check checked':'check'} onClick={()=>setDone(old=>old.includes(e.name)?old.filter(n=>n!==e.name):[...old,e.name])}>{done.includes(e.name)?<Check/>:'✓'}</button></article>)}</section></>}
    {tab==='Progresso'&&<><p className="label">EVOLUÇÃO PESSOAL</p><h1>Progresso <em>real.</em></h1><p className="muted">Seu histórico começa a partir dos treinos concluídos.</p><section className="stats"><Stat icon={<Trophy/>} title="Nível" value="01" note="Novato"/><Stat icon={<Zap/>} title="XP" value={String(120+done.length*30)} note="XP acumulado"/><Stat icon={<Dumbbell/>} title="Concluídos" value={String(done.length)} note="Nesta sessão"/></section><p className="muted">Dados temporários do protótipo; persistência será adicionada com Supabase.</p></>}
    {tab==='Perfil'&&<><p className="label">SEU PERFIL</p><h1>Seu ponto de <em>partida.</em></h1><p className="muted">Dados básicos para personalizar seus objetivos.</p><section className="panel profile"><label>Idade<input type="number" min="18" max="100" placeholder="Ex.: 28" value={age} onChange={e=>setAge(e.target.value)}/></label><label>Altura (cm)<input type="number" placeholder="Ex.: 175" value={height} onChange={e=>setHeight(e.target.value)}/></label><label>Peso (kg)<input type="number" placeholder="Ex.: 82" value={weight} onChange={e=>setWeight(e.target.value)}/></label><p className="muted">Os dados ficam somente nesta tela enquanto o protótipo não tiver banco conectado.</p></section></>}
    <footer>REPFORGE / PROTÓTIPO 0.1 <span>FEITO PARA EVOLUIR</span></footer></main>
    <nav className="mobile-nav">{['Hoje','Treinos','Progresso','Perfil'].map(t=><button key={t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
  </div>
}
function Stat({icon,title,value,note}:{icon:React.ReactNode;title:string;value:string;note:string}){return <div className="stat"><div className="stat-head">{title}{icon}</div><strong>{value}</strong><small>{note}</small></div>}
