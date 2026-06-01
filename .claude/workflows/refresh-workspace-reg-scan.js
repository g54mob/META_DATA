export const meta = {
  name: 'refresh-workspace-reg-scan',
  description: 'Scan all MAIN-SOURCE/ projects for .cs counts, words, class breakdown, assets, genre, skills, status',
  phases: [
    { title: 'Scan', detail: 'Parallel agents each scanning ~5 projects' },
  ],
}

// --- Constants ---
const PROJECTS_PER_AGENT = 5
const MAX_AGENTS = 8

// --- Args (passed from refresh-workspace-reg-pro.md via Claude) ---
// args.projects         - array of project folder names (sorted alphabetically)
// args.totalProjects    - total project count (for validation)
// args.previousStatuses - map of { projectName: "status" } from current WORKSPACE-REG.md (for preservation)

const { projects, totalProjects, previousStatuses } = args

// --- Schema for structured output ---
const PROJECT_SCHEMA = {
  type: 'object',
  properties: {
    scannedProjects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          csCount: { type: 'number' },
          words: { type: 'number' },
          monoBehaviours: { type: 'number' },
          networkBehaviours: { type: 'number' },
          scriptableObjects: { type: 'number' },
          interfaces: { type: 'number' },
          otherClasses: { type: 'number' },
          sprites: { type: 'number' },
          models3d: { type: 'number' },
          animClips: { type: 'number' },
          animControllers: { type: 'number' },
          genre: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          status: { type: 'string' },
          isDllOnly: { type: 'boolean' },
          notes: { type: 'string' }
        },
        required: ['name', 'csCount', 'words', 'monoBehaviours', 'networkBehaviours', 'scriptableObjects', 'interfaces', 'otherClasses', 'sprites', 'models3d', 'animClips', 'animControllers', 'genre', 'skills', 'status', 'isDllOnly']
      }
    }
  },
  required: ['scannedProjects']
}

// --- Chunking ---
const agentsNeeded = Math.ceil(projects.length / PROJECTS_PER_AGENT)
const agentsToLaunch = Math.min(MAX_AGENTS, agentsNeeded)
const chunkSize = Math.ceil(projects.length / agentsToLaunch)

function chunkArray(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const chunks = chunkArray(projects, chunkSize)

log(`Scanning ${totalProjects} projects with ${chunks.length} agents (~${chunkSize} projects/agent)`)

// --- Build previous status context for agents ---
function getPreviousStatusContext(projectList) {
  const entries = projectList
    .filter(p => previousStatuses && previousStatuses[p])
    .map(p => `- ${p}: "${previousStatuses[p]}"`)
  if (entries.length === 0) return ''
  return `\n\n## Previous statuses (from existing registry — preserve if LEARN state unchanged):\n${entries.join('\n')}\n`
}

// --- Agent prompt builder ---
function buildScanPrompt(projectList) {
  return `You are a workspace scanner for a Unity game rebuild workspace.

Your job: For each assigned project in MAIN-SOURCE/, extract structured metadata using shell commands.
Replace {project} below with the actual project folder name for each project you scan.

## Your assigned projects (scan ALL of them):
${projectList.map(p => `- ${p}`).join('\n')}${getPreviousStatusContext(projectList)}

## For EACH project, extract:

**A. File counts:**
- First, list the project's top-level contents to determine structure (Scripts/, Assemblies/, etc.)
- Run: find "MAIN-SOURCE/{project}" -name "*.cs" | wc -l
- If project has ONLY an Assemblies/ folder (DLLs, no raw .cs): set isDllOnly=true, estimate csCount from DLL count × 50

**B. Word count:**
- Run: find "MAIN-SOURCE/{project}" -name "*.cs" -exec cat {} + | wc -w
- Record the EXACT number — no rounding
- Use 300s timeout. If it times out, estimate: csCount × 300 (avg lines) × 8 (words/line) and add a note.

**C. Script class breakdown (use grep -rl within the project, restricted to .cs files):**
- MonoBehaviours: grep -rl --include="*.cs" ": MonoBehaviour\\|: NetworkBehaviour\\|: MonoBehaviourPun\\|: MonoBehaviourPunCallbacks" "MAIN-SOURCE/{project}" | wc -l
- NetworkBehaviours: grep -rl --include="*.cs" ": NetworkBehaviour\\|: MonoBehaviourPun\\|: MonoBehaviourPunCallbacks" "MAIN-SOURCE/{project}" | wc -l
- ScriptableObjects: grep -rl --include="*.cs" ": ScriptableObject" "MAIN-SOURCE/{project}" | wc -l
- Interfaces: grep -rl --include="*.cs" "interface " "MAIN-SOURCE/{project}" | wc -l
- Other: csCount - (monoBehaviours + scriptableObjects + interfaces). If negative, clamp to 0.

**D. Asset counts:**
- Sprites/textures: grep -ci "\\.png\\|\\.jpg\\|\\.psd\\|\\.tga" "MAIN-SOURCE/entire-{project}.stub" (use 0 if no stub file exists)
  NOTE: This counts lines containing these extensions in the .stub file — includes .meta refs. Accept as approximate.
- 3D models: find "MAIN-SOURCE/{project}" -name "*.fbx" -o -name "*.obj" -o -name "*.blend" | wc -l
- Anim clips: find "MAIN-SOURCE/{project}" -name "*.anim" | wc -l
- Anim controllers: find "MAIN-SOURCE/{project}" -name "*.controller" | wc -l
- **Prefer actual file counts** from project folders over stub grep when both exist. Fall back to stub ONLY for sprites (which are typically stripped from source folders but listed in stubs).

**E. Genre classification (order of trust — use the FIRST one that yields a result):**
1. **Primary (authoritative):** If LEARN/{project}/ARCHITECTURE.md or GOAL.md exists, read the genre from there
2. **Secondary:** Explore Scripts/Assembly-CSharp/ subfolders — these contain actual game code organized by domain (e.g., Combat/, Building/, Cartel/, FactoryFloor/, Battle/)
3. **Tertiary:** Search for genre-signal filenames: find "MAIN-SOURCE/{project}" -name "*.cs" | grep -i "farm\\|tower\\|idle\\|horror\\|card\\|physics\\|build\\|craft\\|quest\\|vehicle\\|tycoon\\|colony\\|puzzle\\|mining\\|factory\\|dungeon\\|survival"
4. **Last resort:** Class name patterns from file listings (*Tycoon*, *Horror*, *Tower*, *Card*, *Colony*)
- Use genre labels: "Horror", "Tycoon / Management", "Idle / Incremental", "Factory / Automation", "Mining / Factory", "Physics Sandbox / Combat", "Colony Sim / Strategy", "Card / Strategy", "City / Building Sim", "Action / RPG", "Tower Defense", "Engineering Puzzle", "Narrative / Mystery", "Co-op Multiplayer", "Survival / Crafting"
- Genre classification order of trust: LEARN/ docs > subfolder structure > filename patterns > class name guesses

**F. Skill detection (require 2+ signal matches OR 1 strong match = dedicated folder or assembly):**
| Signal patterns | Skill |
|----------------|-------|
| NavMesh*, AI*, Patrol*, NPC* folders/classes; AstarPathfindingProject assembly | unity-ai-navigation |
| Anim*, Animator*, Spine*, DOTween assembly; animation-heavy folders | unity-animation |
| Audio*, Sound*, Music*, FMOD* assembly; AudioManager class | unity-audio |
| Camera*, Cinemachine assembly*, FreeLook* | unity-camera |
| DayNight*, TimeOfDay*, Sun*, LightCycle*, DayNightFader | unity-day-night |
| Dialogue*, Yarn*, Ink*, Conversation*; YarnSpinner/PixelCrushers assembly | unity-dialogue |
| State*, FSM*, IState*; Animancer.FSM assembly | unity-fsm |
| Grid*, Build*, Place*, Tile*, Snap*; building/placement folders | unity-grid-building |
| Inventory*, Item*, Slot*, Hotbar*, Equipment* (in inventory context) | unity-inventory |
| Photon*, Mirror*, FishNet*, Netcode*; NetworkBehaviour count > 0 | unity-networking |
| Rigidbody*, Joint*, Ragdoll*, Physics*, Force*; ActiveRagdoll folder | unity-physics |
| Procedural*, Perlin*, Chunk*, WorldGen*, Seed*; DunGen assembly | unity-procedural-gen |
| Quest*, Objective*, Journal* | unity-quest |
| Save*, Load*, ISaveable*, Persist*; EasySave assembly; SaveManager class | unity-save-load |

Do NOT include universal skills (unity-input, unity-scene-setup, unity-testing, unity-prefab-hierarchy) — these apply to ALL projects.
For non-universal skills, require at least 2 signal matches OR 1 strong match (dedicated folder OR dedicated assembly).

**G. Status (check LEARN/{project}/ existence):**
- No LEARN folder at all → "Not started"
- Has ARCHITECTURE.md/GOAL.md but no phase-{letter/number} folders → "Init'd"
- Has phase-{x} folders → count them → "Phase {highest} in progress"
- All phases from PhaseMap.md complete → "Complete"
- If status was manually set in previous registry and LEARN folder state hasn't changed, preserve it (don't downgrade)

## CRITICAL RULES:
- Use ACTUAL shell commands for ALL counts — do NOT guess, approximate, or estimate unless a command fails
- Every project in your list MUST appear in output — no skipping, no exceptions
- If a command returns an error (folder doesn't exist), use 0 and add a note explaining what happened
- Use 300s timeout for word-count commands on large projects
- If grep finds no matches, that's 0 — not an error
- Record exact numbers as returned by shell — don't round
- For DLL-only projects (no .cs files): still scan for assets, genre, skills, status`
}

// --- Execute scan ---
phase('Scan')

const results = await parallel(
  chunks.map((chunk, i) => () =>
    agent(buildScanPrompt(chunk), {
      label: `scan:${chunk[0]}..${chunk[chunk.length - 1]}`,
      phase: 'Scan',
      schema: PROJECT_SCHEMA
    })
  )
)

// --- Merge results ---
const allProjects = results
  .filter(Boolean)
  .flatMap(r => r.scannedProjects)

const scannedCount = allProjects.length
const missing = projects.filter(p => !allProjects.find(sp => sp.name === p))

if (missing.length > 0) {
  log(`WARNING: ${missing.length} projects missing from scan results: ${missing.join(', ')}`)
}

log(`Scan complete: ${scannedCount}/${totalProjects} projects scanned by ${chunks.length} agents`)

return {
  projects: allProjects,
  agentStats: {
    agentsLaunched: chunks.length,
    projectsPerAgent: chunkSize,
    scannedCount: scannedCount,
    missingProjects: missing
  }
}
