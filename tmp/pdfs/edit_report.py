import sys,json,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'deps'))
import pymupdf as f
ROOT=Path(__file__).parent
OUT=ROOT.parents[1]/'output/pdf'
OUT.mkdir(parents=True,exist_ok=True)
SRC=f.open(r'C:\Users\Rohit\Downloads\naveen.pdf')
LAY=json.loads((ROOT/'layout.json').read_text(encoding='utf-8'))
FONT={'r':r'C:\Windows\Fonts\times.ttf','b':r'C:\Windows\Fonts\timesbd.ttf','i':r'C:\Windows\Fonts\timesi.ttf'}
FT={k:f.Font(fontfile=v) for k,v in FONT.items()}
AS=ROOT.parents[1]/'packages/web/public/images'
TEMP=Path(r'C:\Users\Rohit\AppData\Local\Temp')
edits={}; images={}; tables={}
def change(p,a,b,text,align='left',style=None):
    edits.setdefault(p,[]).append((a,b,text,align,style))
def group(p,a,b,text): change(p,a,b,text)
def one(p,a,text,align='left',style=None): change(p,a,a,text,align,style)
def assetfig(name,items,w=1000,h=625):
    d=f.open();p=d.new_page(width=w,height=h)
    for path,box in items:p.insert_image(f.Rect(box),filename=str(path))
    p.get_pixmap().save(ROOT/(name+'.png'));return ROOT/(name+'.png')
def diagram(name,nodes,edges,w=1000,h=620):
    d=f.open();p=d.new_page(width=w,height=h)
    for k,v in FONT.items():p.insert_font(fontname=k,fontfile=v)
    for i,j in edges:
        a=nodes[i][0];b=nodes[j][0]; x1=(a[0]+a[2])/2;y1=a[3];x2=(b[0]+b[2])/2;y2=b[1]
        if abs(x1-x2)>150 and abs(a[1]-b[1])<40:x1=a[2];y1=(a[1]+a[3])/2;x2=b[0];y2=(b[1]+b[3])/2
        p.draw_line((x1,y1),(x2,y2),color=(.25,.25,.25),width=2)
        p.draw_circle((x2,y2),3,color=(.25,.25,.25),fill=(.25,.25,.25))
    for box,title,body in nodes:
        r=f.Rect(box);p.draw_rect(r,color=(.4,.4,.4),fill=(.97,.97,.99),width=1.5)
        p.insert_textbox(f.Rect(r.x0+10,r.y0+12,r.x1-10,r.y0+45),title,fontname='b',fontsize=23,align=1)
        p.insert_textbox(f.Rect(r.x0+15,r.y0+52,r.x1-15,r.y1-6),body,fontname='r',fontsize=19,align=0)
    p.get_pixmap().save(ROOT/(name+'.png'));return ROOT/(name+'.png')
# Figure assets: original project sprites composed for documentation, never presented as live results.
g=AS/'greenhouse';o=AS/'observatory'
scene=assetfig('greenhouse',[(g/'greenhouse-background-clean.png',(0,0,1000,625)),(g/'greenhouse-walkway-native.png',(0,470,1000,570)),(g/'greenhouse-scanning-rail-native.png',(160,280,820,370)),(g/'fern-dormant.png',(160,395,230,480)),(g/'flower-dormant.png',(510,395,580,480)),(g/'vine-dormant.png',(700,395,780,480)),(g/'greenhouse-power-core-dormant.png',(850,315,950,480))])
rail=assetfig('rail',[(g/'greenhouse-scanning-rail-native.png',(70,220,930,360)),(g/'energy-crystal-dormant.png',(100,100,170,225)),(g/'energy-crystal-activated-sparkles.png',(780,100,850,225)),(g/'three-slot-collector-native.png',(350,360,650,485))])
character=assetfig('character',[(g/'hooded-boy-idle-4frames.png',(80,55,920,250)),(g/'hooded-boy-celebrate-6frames.png',(55,325,945,545))])
plants=assetfig('plants',[(g/(name+'.png'),(60+i*320,80+j*240,270+i*320,280+j*240)) for i,kind in enumerate(['fern','flower','vine']) for j,name in enumerate([kind+'-dormant',kind+'-revived'])])
cores=assetfig('cores',[(g/'greenhouse-power-core-dormant.png',(140,60,400,560)),(g/'greenhouse-power-core-powered.png',(600,60,860,560))])
windows=diagram('windows',[
((35,30,475,255),'Fixed window - maximum sum','[4, 2, 7, 1, 6, 3, 8, 5]\nk = 3\nAdd the incoming value.\nRemove the outgoing value.'),
((525,30,965,255),'Fixed window - count valid','[2, 5, 1, 4, 3, 6, 2, 7]\nk = 3, target = 12\nCheck every complete window.\nCount those meeting the target.'),
((35,325,475,590),'Variable window - shortest','[2, 3, 1, 2, 4, 3, 2, 1]\ntarget = 7\nExpand to reach the target.\nShrink while the sum stays valid.'),
((525,325,965,590),'Variable window - longest','[3, 1, 2, 1, 4, 2, 1, 5]\nbudget = 7\nExpand the right boundary.\nShrink when the budget is exceeded.')],[])
binary=diagram('binary',[
((70,20,930,175),'Find the Signal','Readings: [3, 8, 12, 17, 23, 31, 42, 56, 70]\nTarget: 31; use zero-based indices.'),
((70,220,465,375),'First midpoint: index 4','23 < 31\nContinue in indices 5 to 8.'),
((535,220,930,375),'Next midpoint: index 6','42 > 31\nContinue at index 5.'),
((270,440,730,585),'Target found: index 5','readings[5] = 31\nReturn 5; return -1 if absent.')],[(0,1),(1,2),(2,3)])
schema1=diagram('schema1',[
((300,25,700,195),'users','id (PK), username, email\npassword_hash, xp\ncreated_at, updated_at'),
((30,315,465,570),'submissions','id (PK), user_id (FK)\nchallenge_id (FK), code\nstatus, result, created_at'),
((535,315,970,570),'stage_xp_grants','id (PK), user_id (FK)\nstage_id, amount, created_at\nUNIQUE (user_id, stage_id)')],[(0,1),(0,2)])
schema2=diagram('schema2',[
((30,30,430,205),'regions','id (PK), slug, name\ndescription, order_index, theme'),
((565,30,965,205),'patterns','id (PK), region_id (FK), slug\nname, difficulty, complexity'),
((565,320,965,585),'challenges','id (PK), pattern_id (FK), slug\ntitle, description, constraints\nstarter_code, difficulty'),
((30,320,430,585),'test_cases','id (PK), challenge_id (FK)\ntest_key, input, expected\nhidden, order_index')],[(0,1),(1,2),(2,3)])
schema3=diagram('schema3',[
((30,30,435,230),'challenges','One challenge has many test cases\nand many submissions.\nA challenge belongs to a pattern.'),
((565,30,970,230),'test_cases','Visible examples: hidden = false\nHidden checks: hidden = true\nExpected output remains server-side.'),
((30,355,435,585),'submissions','Connects user_id and challenge_id\nStores code, status and result\nAccepted attempts support progress.'),
((565,355,970,585),'stage_xp_grants','Connects a user to a stage\nUnique user / stage pair\nPrevents repeated XP rewards.')],[(0,1),(0,2),(2,3)])
workflow=diagram('workflow',[
((10,15,245,180),'Select stage','Read mission\nReview examples'),((260,15,495,180),'Write C++','Ordinary function\nRun examples'),((510,15,745,180),'Submit','Hidden test cases\nJudge result'),((760,15,995,180),'Restore scene','Accepted solution\nAward stage XP')],[(0,1),(1,2),(2,3)],h=200)
auth=diagram('auth',[
((5,5,240,160),'Credentials','Email + password'),((255,5,490,160),'Express API','Validate + bcrypt'),((505,5,740,160),'JWT session','Access + refresh'),((755,5,990,160),'Protected API','Verify access token')],[(0,1),(1,2),(2,3)],h=170)
obs=TEMP/'codex-clipboard-7df2fb3b-aea5-4a49-ae3a-0c9cddac27b3.png'
editor=TEMP/'codex-clipboard-822015ca-fe72-4d77-a70f-368b1d691fa1.png'
complete=TEMP/'codex-clipboard-83662bbf-9f39-4d1c-9bb2-5f77b1e38bf2.png'
images={9:[ROOT/'home.png'],10:[ROOT/'register.png',scene],11:[rail,obs],12:[editor,complete],13:[obs,character],14:[plants,cores],15:[ROOT/'login.png',windows],16:[binary],17:[schema1],18:[schema2,schema3],19:[workflow,auth]}
# Cover and declarations.
one(1,3,'DSA Arcade','center','b');one(1,4,'Game-Based Data Structures and Algorithms Learning','center','b')
one(1,12,'Name : Rohit\nCollege Roll No: 26160\nBranch: CSE\nSemester: VII')
group(2,3,5,'I, Rohit (Roll No. 26160), student of Computer Science and Engineering, declare that the report entitled DSA Arcade: Game-Based Data Structures and Algorithms Learning represents the work and progress submitted for Mid-Term 2 project evaluation.')
one(2,12,'Signature of the Student\nRohit,\nRoll No.: 26160')
group(3,1,6,'Learning data structures and algorithms often requires students to connect abstract ideas with program execution. Static explanations alone can make window boundaries, running sums and search intervals difficult to understand. DSA Arcade is a web-based learning project that combines a pixel-art adventure with interactive algorithm demonstrations. Learners explore a greenhouse and an observatory, study a problem and write an ordinary C++ solution to restore the scene.')
group(3,7,11,'The greenhouse chapter teaches four sliding-window tasks, while the observatory introduces binary search. A movable C++ editor provides Run for visible examples and Submit for hidden tests. React and Phaser provide the interface; Express, Prisma and PostgreSQL manage accounts and challenges. A separate C++ runner evaluates code, and accepted submissions award stage experience points.')
group(3,12,17,'At Mid-Term 2, the source code, project assets and supplied gameplay screenshots document the prototype. The website is hosted on Vercel with API, database and runner services on Railway. Production authentication previously returned an internal server error; database migration and integration checks remain necessary. This report distinguishes implemented features, visual evidence and pending validation. No measured learning gains or performance benchmarks are claimed.')
group(3,18,19,'Keywords: Data Structures, Algorithms, Sliding Window, Binary Search, C++, Phaser, React, PostgreSQL, Gamified Learning.')
group(4,1,3,'I express my sincere gratitude to the Department of Computer Science and Engineering, Dronacharya College of Engineering, for the opportunity to develop DSA Arcade: Game-Based Data Structures and Algorithms Learning.')
group(4,7,9,'I am grateful to my peers and to the documentation and development communities that helped me understand interactive game design, web development, databases, authentication and algorithm-based learning workflows.')
group(4,10,11,'This work has strengthened my understanding of combining algorithm instruction, C++ problem solving and visual feedback in one learning platform.')
one(4,12,'Rohit\nRoll No.: 26160\nDepartment of Computer Science & Engineering\nDronacharya College of Engineering, Gurugram')
# Introductory chapters.
group(6,3,5,'Students often learn algorithm patterns through static notes and isolated coding questions. Connecting an explanation to window movement or search boundaries can be difficult, particularly when the learner receives only a final answer or error message.')
group(6,6,7,'Practice can become repetitive when there is little visual context or feedback. Learners need a clear connection between the problem, the algorithm and their C++ solution.')
one(6,10,'1. To teach sliding windows and binary search through interactive missions.')
one(6,11,'2. To accept ordinary C++ solutions with visible and hidden test cases.')
one(6,12,'3. To explain algorithm steps through optional visual walkthroughs.')
group(6,13,14,'4. To connect accepted submissions with scene restoration, character feedback and stage experience points.')
group(6,16,18,'The platform is intended to make algorithm practice easier to follow, encourage repeated attempts and provide a visible sense of progress. These expected benefits require learner feedback and evaluation; they are not measured outcomes of this report.')
group(6,20,21,'The project applies web development and game design to programming education, linking fundamental algorithm concepts with practical C++ problem solving.')
group(7,3,4,'DSA Arcade demonstrates a browser-based learning game with a greenhouse for sliding windows and an observatory for binary search, linked to a C++ problem panel.')
one(7,6,'The core demonstration covers three connected activities:')
one(7,7,'\u2022 Learn: review the mission, examples, hints and optional walkthrough.')
one(7,8,'\u2022 Solve: write a C++ function and run the visible example test cases.')
one(7,9,'\u2022 Restore: submit hidden tests to complete the stage and earn XP.')
group(7,11,12,'The frontend is available at https://dsa-arcade-gilt.vercel.app. Railway hosts the API, PostgreSQL and runner services; production integration checks are still required.')
one(7,16,'\u2022 PostgreSQL persistence and production migrations')
one(7,17,'\u2022 JWT sessions, refresh cookies and protected routes')
one(7,18,'\u2022 C++ execution limits and visible / hidden test separation')
one(7,19,'\u2022 Completion persistence, XP and responsive layouts')
group(8,3,6,'The prototype includes account pages, adventure selection, four greenhouse missions and one observatory mission. Players use a C++ workbench with Run and Submit controls. Phaser scenes provide visual explanations and restoration effects. PostgreSQL stores users, challenges, test cases, submissions and stage XP grants through Prisma.')
tables[8]=[['Learning entry','Homepage, account entry and greenhouse assets','Figs. 3.1-3.4'],['Game and editor','Observatory scene, C++ editor and completion UI','Figs. 3.5-3.8'],['Visual feedback','Character, plant and power-core sprite assets','Figs. 3.9-3.11'],['Authentication','Account login and protected session entry','Fig. 3.12'],['Algorithm lessons','Fixed / variable windows and binary search','Figs. 3.13-3.14']]
group(8,23,26,'The frontend requests challenge data from the Express API. Code is evaluated by a separate runner, and submissions are stored in PostgreSQL. Accepted solutions trigger scene feedback and stage XP. The following figures identify live public pages, supplied gameplay screenshots and project asset illustrations separately.')
# Same figure positions and caption typography as the source.
one(9,1,'The figures show public pages, supplied gameplay screenshots and project asset illustrations.')
one(9,2,'3.3.1 Learning Entry and Greenhouse')
group(9,3,4,'Homepage: Introduces DSA Arcade and provides entry to the learning adventure. This image was captured from the public project website.')
one(9,5,'Fig. 3.1: DSA Arcade homepage','caption')
group(10,0,1,'Registration: Provides an account form for username, email and password. This public page capture documents the interface, not a successful account creation.')
one(10,2,'Fig. 3.2: Account registration','caption')
group(10,3,4,'Greenhouse: Introduces the sliding-window setting with crystals, plants and a dormant power core. The illustration uses the project\'s original scene assets.')
one(10,5,'Fig. 3.3: Greenhouse project asset illustration','caption')
group(11,0,1,'Crystal Rail: Represents consecutive array values and a moving collector. These native project sprites support the fixed-window explanation.')
one(11,2,'Fig. 3.4: Crystal rail and collector assets','caption')
one(11,3,'3.3.2 Gameplay and C++ Workbench')
group(11,4,5,'Find the Signal: Presents sorted frequency readings and a target in the observatory. The supplied screenshot shows the binary-search mission interface.')
one(11,6,'Fig. 3.5: Observatory mission screenshot','caption')
group(12,0,1,'C++ Workbench: Combines the problem statement, starter code and execution controls. The supplied image shows the floating editor with its resize corner.')
one(12,2,'Fig. 3.6: Movable C++ workbench','caption')
group(12,3,4,'Stage Completion: The supplied screenshot shows a completion panel, returned index and XP reward. It records the visible interface rather than a production test result.')
one(12,5,'Fig. 3.7: Stage completion and experience reward','caption')
group(13,0,1,'Adjustable Layout: The code workbench can be moved and resized over the scene. This supplied screenshot shows the compact window and observatory objects.')
one(13,2,'Fig. 3.8: Floating editor in the observatory','caption')
one(13,3,'3.3.3 Character and Restoration Assets')
group(13,4,5,'Character Animation: The hooded boy retains a consistent visual design. Idle and celebration sprite strips provide frames for in-game character feedback.')
one(13,6,'Fig. 3.9: Hooded character animation assets','caption')
group(14,0,1,'Plant Restoration: Dormant and revived fern, flower and vine sprites represent greenhouse recovery. These asset pairs support completion feedback.')
one(14,2,'Fig. 3.10: Dormant and revived plant assets','caption')
group(14,3,4,'Power Core: Dormant and powered forms show the greenhouse mechanism before and after restoration. These are separate interactive project sprites.')
one(14,5,'Fig. 3.11: Dormant and powered core assets','caption')
one(15,0,'3.3.4 Account Login')
group(15,1,2,'Login: Provides email and password entry for returning learners. This capture shows the public login screen; production session reliability requires separate validation.')
one(15,3,'Fig. 3.12: DSA Arcade login page','caption')
one(15,4,'3.3.5 Algorithm Explanations')
group(15,5,6,'Sliding Windows: Four greenhouse stages use distinct example arrays. This diagram summarizes the fixed and variable window tasks defined in project metadata.')
one(15,7,'Fig. 3.13: Greenhouse stage examples and techniques','caption')
group(16,0,1,'Binary Search: The target is located by comparing midpoint readings and reducing the active range. This diagram illustrates the stage example; it is not player execution.')
one(16,2,'Fig. 3.14: Binary-search example walkthrough','caption')
group(16,4,6,'\u2022 Visual evidence: screenshots and asset illustrations show the interface and design. They do not prove database persistence, production authentication, runner isolation or hidden-test correctness.')
group(16,7,8,'\u2022 Integration checks: registration and login previously returned HTTP 500 in deployment; database migration and session checks remain necessary.')
group(16,9,10,'\u2022 Further validation: test editor layout across devices, repeated submissions, execution limits, progress restoration and error recovery.')
group(17,3,4,'Figures 4.1 to 4.3 are diagrams derived from the project\'s Prisma schema. They document PostgreSQL entities and relationships rather than a database administration screenshot.')
group(17,5,6,'\u2022 Tables: users, regions, patterns, challenges, test_cases, submissions and stage_xp_grants organize learning content and account progress.')
group(17,7,8,'\u2022 Relationships: patterns belong to regions; challenges belong to patterns. Test cases and submissions reference challenges; submissions and XP grants reference users.')
one(17,9,'Fig. 4.1: Users, submissions and stage XP grants','caption')
one(18,0,'Fig. 4.2: Regions, patterns, challenges and test cases','caption')
one(18,1,'Fig. 4.3: Challenge evaluation and progress relationships','caption')
one(19,0,'4.2 Learning and Submission Workflow')
group(19,1,4,'Figure 4.4 shows the learning flow. A learner selects a stage, reads its independently written problem and writes a C++ solution. Run evaluates visible examples; Submit includes hidden checks. Accepted submissions restore scene elements and award stage XP. The optional walkthrough explains the algorithm separately from player execution.')
one(19,5,'Fig. 4.4: DSA Arcade learning and submission flow','caption')
one(19,6,'4.3 JWT and Refresh-Token Authentication Flow')
one(19,7,'Figure 4.5 summarizes the session design implemented in the project source:')
group(19,8,9,'1. The learner enters credentials. The API validates the input and looks up the account in PostgreSQL.')
group(19,10,11,'2. The password is checked with bcrypt. Successful authentication returns an access token and sets a refresh cookie.')
one(19,12,'3. Protected requests carry a JWT; the server validates its signature and expiry.')
group(19,13,14,'4. The refresh route issues a new access token when the refresh session is valid. Production cookie and database behavior must be tested.')
one(19,15,'Fig. 4.5: JWT access and refresh session flow','caption')
group(19,16,17,'Security requirement: protect JWT secrets, use secure cookies over HTTPS, validate inputs and enforce access checks on the server for every protected operation.')
tables[20]=[['Database','PostgreSQL / Prisma','Stores users, content, test cases, submissions and XP'],['Authentication','JWT / bcrypt','Signed sessions, refresh cookies and password hashes'],['Web interface','React / TypeScript','Pages, routing, API state and Monaco C++ editor'],['Game scenes','Phaser','Crystal rail, observatory and character animation'],['Code runner','Node.js / g++','Evaluates C++ in a separate service with limits'],['Deployment','Vercel / Railway','Website, API, PostgreSQL and execution service']]
group(21,3,4,'The following scenarios define the evaluation plan for DSA Arcade. Source and visual evidence establish features, while end-to-end results require recorded execution logs.')
tables[21]=[
['TC01','Account registration','User record and session created','Pending retest'],['TC02','Invalid login','Safe rejection without a session','Pending retest'],['TC03','Maximum fixed sum','Correct sum for window size k','Source reviewed'],['TC04','Count valid windows','Correct number above threshold','Source reviewed'],['TC05','Minimum target length','Shortest valid window returned','Source reviewed'],['TC06','Longest budget window','Longest affordable range returned','Source reviewed'],['TC07','Binary search','Index returned; -1 when absent','UI evidence'],['TC08','Run examples','Only visible cases evaluated','Source reviewed'],['TC09','Submit hidden cases','Correct solution accepted','Pending test'],['TC10','JWT session expiry','Expired access token rejected','Pending test'],['TC11','Stage XP replay','No duplicate stage reward','Pending test'],['TC12','Runner limits','Invalid / slow code is contained','Pending test']]
group(21,24,25,'No learning-gain or latency benchmark is claimed. The API health endpoint responded, but production login returned HTTP 500 during setup. Record test outcomes as follows:')
one(21,31,'4. Include negative tests for JWT expiry, hidden-case failures and runner limits.')
group(22,3,5,'The prototype implements account pages, adventure selection, four sliding-window missions and a binary-search mission. It includes C++ editing, example and hidden test flows, project sprites, walkthroughs and stage XP data models.')
one(22,7,'\u2022 Complete production migrations and verify registration / login.')
one(22,8,'\u2022 Verify JWT refresh, secure cookies and protected endpoints.')
one(22,9,'\u2022 Validate runner limits and hidden-test results.')
one(22,10,'\u2022 Improve error recovery and completion persistence.')
one(22,11,'\u2022 Check responsive scenes and editor controls across devices.')
one(22,14,'\u2022 Execute positive and negative cases for all five learning stages.')
one(22,15,'\u2022 Record correctness, execution time and learner usability feedback.')
one(22,16,'\u2022 Compare understanding before and after the visual algorithm lessons.')
group(22,18,20,'DSA Arcade connects algorithm practice with a visual adventure and ordinary C++ solutions. Sliding windows and binary search provide the initial learning scope. The next milestone is verified production reliability and an evaluation of learning usefulness.')
group(23,1,4,'I, Rohit (College Roll No. 26160), confirm that the work presented in this Mid-Term 2 Project Evaluation Report on DSA Arcade: Game-Based Data Structures and Algorithms Learning reflects the progress made on my project up to the Mid-Term 2 evaluation. Work that remains is identified as such in the report.')

def wrap(text,width,size,key):
    lines=[]
    for para in text.split('\n'):
        line=''
        for word in para.split():
            test=(line+' '+word).strip()
            if FT[key].text_length(test,fontsize=size)>width and line:lines.append(line);line=word
            else:line=test
        lines.append(line)
    return lines
def drawtext(page,text,box,size=12,key='r',align='left',maxlines=None,leading=None,bold_prefix=''):
    box=f.Rect(box);lines=wrap(text,box.width,size,key)
    if maxlines and len(lines)>maxlines:raise ValueError(f'Overflow page {page.number+1}: {len(lines)} > {maxlines}: {text}')
    lead=leading or size*1.15
    y=box.y0+size*.891
    if y+(len(lines)-1)*lead>box.y1+2:raise ValueError(f'HEIGHT page {page.number+1}: {text}')
    for i,line in enumerate(lines):
        width=FT[key].text_length(line,fontsize=size)
        x=box.x0+(box.width-width)/2 if align=='center' else box.x0
        if align=='justify' and i<len(lines)-1 and len(line.split())>1:
            words=line.split(); keys=[];offset=0
            for word in words:
                keys.append('b' if i==0 and bold_prefix and offset<len(bold_prefix) else key)
                offset+=len(word)+1
            spacing=(box.width-sum(FT[k].text_length(z,fontsize=size) for z,k in zip(words,keys)))/(len(words)-1)
            for word,k in zip(words,keys):page.insert_text((x,y),word,fontname=k,fontsize=size);x+=FT[k].text_length(word,fontsize=size)+spacing
        elif i==0 and bold_prefix and line.startswith(bold_prefix):
            page.insert_text((x,y),bold_prefix,fontname='b',fontsize=size)
            x+=FT['b'].text_length(bold_prefix,fontsize=size)
            page.insert_text((x,y),line[len(bold_prefix):],fontname='r',fontsize=size)
        else:page.insert_text((x,y),line,fontname=key,fontsize=size)
        y+=lead

for num,page in enumerate(SRC,1):
    for key,path in FONT.items():page.insert_font(fontname=key,fontfile=path)
    blocks=LAY[num-1]['blocks'];tasks=[]
    # Redact only replacement text, keeping every table border, heading and footer intact.
    for a,b,text,align,sty in edits.get(num,[]):
        selected=blocks[a:b+1];spans=[s for bl in selected for s in bl['spans'] if s['text'].strip()]
        key=sty or ('b' if 'Bold' in spans[0]['font'] else 'i' if 'Italic' in spans[0]['font'] else 'r')
        bold_prefix=''
        if not sty and key=='b' and any('Bold' not in s['font'] for s in spans):
            key='r'
            if ':' in text:bold_prefix=text.split(':')[0]+':'
            if num==4 and a==12:bold_prefix='Rohit'
        size=spans[0]['size'];x=selected[0]['box'][0];y=selected[0]['box'][1]
        end=max(bl['box'][3] for bl in selected)
        if align=='caption':
            cap=next(s for s in spans if 'Fig.' in s['text']);size=cap['size'];key='i';y=cap['bbox'][1];end=y+size*1.5
        for bl in selected:
            for s in bl['spans']:
                if s['text'].strip():page.add_redact_annot(f.Rect(s['bbox']),fill=False)
        if align=='center':box=(72,y,526,end+3);ml=1;ld=None
        elif align=='caption':box=(72,y,526,end+3);ml=1;ld=None;align='center'
        else:
            box=(x,y,526,end+3)
            if num==1 and a==12:box=(x,y,290,end+3)
            unique=sorted(set(round(s['origin'][1],2) for s in spans));ml=len(unique)
            ld=(unique[-1]-unique[0])/(len(unique)-1) if len(unique)>1 else None
            if len(selected)>1 and x==72:align='justify'
        tasks.append((text,box,size,key,align,ml,ld,bold_prefix))
    # Table body replacements retain existing cell lines and header shading.
    tdata=[]
    if num in tables:
        ts=page.find_tables().tables
        for ti,t in enumerate(ts):
            if num==21 and ti==1:vals=[['12','6','6']]
            elif ti==0:vals=tables[num]
            else:continue
            for ri,row in enumerate(t.rows[1:]):
                for ci,cell in enumerate(row.cells):
                    rect=f.Rect(cell)
                    for bl in blocks:
                        for s in bl['spans']:
                            sr=f.Rect(s['bbox'])
                            if rect.contains(f.Point((sr.x0+sr.x1)/2,(sr.y0+sr.y1)/2)):page.add_redact_annot(sr,fill=False)
                    tdata.append((vals[ri][ci],f.Rect(rect.x0+4,rect.y0+3,rect.x1-4,rect.y1-2)))
    # Index edits: replace only individual cells, preserve all other entries.
    if num==5:
        for b in blocks:
            for s in b['spans']:
                old=s['text'].strip();new=None
                if '4.2 Placement' in old:new='4.2 Learning and Submission Workflow'
                if '4.3 JWT and Brevo' in old:new='4.3 JWT and Refresh-Token Authentication Flow'
                if new:
                    page.add_redact_annot(f.Rect(s['bbox']),fill=False)
                    tasks.append((new,(s['bbox'][0],s['bbox'][1],470,s['bbox'][3]+3),s['size'],'r','left',1,None))
    if num==21:
        for s in blocks[21]['spans']:
            if 'UI screenshot only' in s['text']:
                page.add_redact_annot(f.Rect(s['bbox']),fill=False)
                tasks.append(('Source / UI evidence',(226,s['bbox'][1],373,s['bbox'][3]+3),s['size'],'b','center',1,None))
    page.apply_redactions(images=0,graphics=0)
    for key,path in FONT.items():page.insert_font(fontname=key,fontfile=path)
    for args in tasks:drawtext(page,*args)
    for text,box in tdata:drawtext(page,text,box,10,'r',leading=11.5)
    # Original figure slots retained; aspect ratio kept with white letterboxing.
    if num in images:
        for old,path in zip(LAY[num-1]['images'],images[num]):
            page.delete_image(old['xref'])
            rect=f.Rect(old['box']);page.draw_rect(rect,color=None,fill=(1,1,1));page.insert_image(rect,filename=str(path),keep_proportion=True)
    # Remove outdated hyperlinks to the previous project.
    for link in page.get_links():
        if 'smartplacify' in link.get('uri','').lower():page.delete_link(link)

# Correct source index page references while keeping the same text style and cell positions.
page=SRC[4]
for bi in range(22,35):
    block=LAY[4]['blocks'][bi]
    for s in block['spans']:
        text=s['text'].strip()
        if text.isdigit() and s['bbox'][0]>470:
            r=f.Rect(s['bbox']);page.add_redact_annot(r,fill=False)
            page.apply_redactions(images=0,graphics=0)
            page.insert_font(fontname='r',fontfile=FONT['r'])
            page.insert_text(s['origin'],str(int(text)+1),fontname='r',fontsize=s['size'])
SRC.set_metadata({'title':'DSA Arcade - Mid-Term 2 Project Evaluation Report','author':'Rohit - 26160','subject':'Game-Based Data Structures and Algorithms Learning'})
target=OUT/'Rohit_26160_DSA_Arcade_Report.pdf'
SRC.save(target,garbage=4,deflate=True)
check=f.open(target)
txt=' '.join(p.get_text() for p in check)
for term in ['Naveen','26116','SmartPlacify','Supabase','Brevo','Grok','TPO']:
    if term.lower() in txt.lower():raise ValueError('OLD TEXT: '+term)
for i,p in enumerate(check):p.get_pixmap(matrix=f.Matrix(1,1)).save(ROOT/f'final-{i+1:02}.png')
print('SAVED',target,'PAGES',len(check))
