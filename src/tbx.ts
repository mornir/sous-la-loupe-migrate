import fiches from '../output/fiches.json'

const sourceDesc = 'Fiches du fichier français'

// @ts-ignore
const termEntries = fiches.map((f) => {

  // @ts-ignore
  const langSets = f.traductions.map((t) => {

    return `<langSet xml:lang="fr">
    <tig>
    <term id="${t.id}">${t.terme}</term>
    </tig>
    </langSet>`
  }).join('\r\n')

  return `<termEntry id="${f.id}">
    <langSet xml:lang="de">
    <tig>
      <term id="${f.id}">${f.vedette}</term>
    </tig>
    </langSet>
    ${langSets}
 </termEntry>`
}).join('\r\n')



const output = `<?xml version='1.0' encoding='UTF-16' ?> <!DOCTYPE martif SYSTEM "TBXcoreStructV02.dtd">
<martif type="TBX" xml:lang="de">
 <martifHeader>
 <fileDesc>
 <sourceDesc>
 <p>${sourceDesc}</p>
 </sourceDesc>
 </fileDesc>
 <encodingDesc>
 <p type="XCSURI">http://www.lisa.org/fileadmin/standards/tbx/TBXXCSV02.XCS</p>
 </encodingDesc>
 </martifHeader>
 <text>
 <body>
  ${termEntries}
 </body>
 </text>
</martif>`


await Bun.write('./output/fiches.xml', output)