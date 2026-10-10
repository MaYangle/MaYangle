export function validateProjectSelection(config){
  const options=config.projects;
  if(!['auto','manual'].includes(options.mode||'auto'))throw new Error('Project mode must be auto or manual');
  const featured=options.featured||[];
  if(!Array.isArray(featured)||featured.some(repo=>typeof repo!=='string'||!/^[-\w.]+\/[-\w.]+$/.test(repo)||repo.split('/')[0].toLowerCase()!==config.username.toLowerCase()))throw new Error('Featured projects must be repository names owned by the configured user');
  if(new Set(featured.map(repo=>repo.toLowerCase())).size!==featured.length)throw new Error('Featured repositories must not be duplicated');
}

export function selectFeaturedProjects(projects,config){
  const order=new Map((config.projects.featured||[]).map((repo,i)=>[repo.toLowerCase(),i]));
  const candidates=(config.projects.mode||'auto')==='manual'?projects.filter(project=>order.has(project.repo.toLowerCase())):[...projects];
  return candidates.map((project,i)=>({project,i})).sort((a,b)=>(order.get(a.project.repo.toLowerCase())??Infinity)-(order.get(b.project.repo.toLowerCase())??Infinity)||a.i-b.i).slice(0,config.projects.maxVisible).map(item=>item.project);
}
