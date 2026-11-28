// Psychedelics and Plant Medicine: an educational tab in the Sacred Sciences family (Samadhi approved the plan, Nov 2026).
// Rules for this tab: education only. No doses, amounts, recipes, preparation or "where to find". Every page shows the
// same safety box at the top (added by lib/pages.js for this tab) and the full safety page is linked from each one.
// Each tradition is described in its own words; verified science is kept apart from hypothesis.
// Facts checked Nov 2026: Palhano-Fontes et al., Psychological Medicine 2019; Dean et al., Scientific Reports 2019;
// El-Seedi et al., J. Ethnopharmacology 2005; Nayak et al., Pharmacopsychiatry 2021; Callaway & Grob 1998 (ayahuasca and SSRIs);
// Compass Pathways NDA for COMP360 completed 9 Nov 2026 (not approved); LSD in phase 3 trials (not approved);
// Oregon (2020) and Colorado (2022) regulated programmes; Gonzales v. O Centro (US Supreme Court, 2006).

const series = (n) => `*Psychedelics and Plant Medicine · ${n} of 9: [Overview](/teachings/plant-medicine-overview) · [Ayahuasca](/teachings/ayahuasca) · [Psilocybin](/teachings/psilocybin-sacred-mushrooms) · [DMT and 5-MeO-DMT](/teachings/dmt-and-5-meo-dmt) · [Mescaline](/teachings/mescaline-peyote-and-san-pedro) · [LSD](/teachings/lsd-hofmanns-discovery) · [The Brain](/teachings/psychedelics-and-the-brain) · [Set, Setting and Integration](/teachings/set-setting-and-integration) · [Safety and the Law](/teachings/plant-medicine-safety).*`;

const safetyLink = `\n\n**Before anything else, please read [Safety, Medicine Interactions and the Law](/teachings/plant-medicine-safety).**`;

// Samadhi's own experience, in his words (Nov 2026), shown on an ancient scroll on the Ayahuasca page.
export const samadhiAyahuascaView = [
  "I have sat in three ayahuasca ceremonies. They were so profound.",
  "I know I was with God and the Masters. I came back with visions of the future, and the ceremonies opened the doors to finding the way home.",
  "Ayahuasca is definitely recommended.",
  "This is my own experience and insight, not medical advice. Every person and every soul is unique and different.",
];
export const samadhiViewScroll = () => `<figure class="about-scroll judge-scroll pm-view" aria-label="Samadhi's view, written on an ancient scroll"><img class="as-roll" src="/images/about-scroll-top.png" width="800" height="133" alt="" aria-hidden="true"><div class="as-unroll"><div class="as-inner"><div class="as-text">${samadhiAyahuascaView.map((l) => `<p>${l}</p>`).join("")}<p class="as-sign">Samadhi</p></div></div></div><img class="as-roll as-roll-bot" src="/images/about-scroll-bot.png" width="800" height="132" alt="" aria-hidden="true"></figure>`;

export const plantMedicine = [
  { slug: "plant-medicine-overview", tag: "Overview", title: "Psychedelics and Plant Medicine: The Sacred and the Science",
    image: { small: true, src: "/images/plant-medicine/overview.jpg", width: 1000, height: 1000, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "A coiled Amazonian vine, a small cactus, a dried mushroom, a clay bowl, an old book, a brass astrolabe and a candle on an ancient wooden desk" },
    summary: "What psychedelics and entheogens are, how ancient peoples used sacred plants in ceremony, how modern science came to study them, and why the two worlds are not the same.",
    body: `${series(1)}

Since the oldest times, some peoples have used certain plants and mushrooms in sacred ceremony to open the doors of the mind and to seek healing, vision and contact with the Divine. In the last eighty years, modern science has also begun to study these substances in laboratories and hospitals. This section looks at both worlds calmly and honestly, for seekers who want to understand, not to be persuaded.

**This is education, not encouragement and not medical or legal advice.** Nothing here tells anyone to take any substance.${safetyLink}

## Two words
- **Psychedelic** means "mind-manifesting". The word was coined in 1956 by the psychiatrist **Humphry Osmond**, in letters with the writer Aldous Huxley, and introduced to the scientific world the following year.
- **Entheogen** means "becoming divine within" or "God generated within". It was proposed in 1979 by a group of scholars of religion and ethnobotany who wanted a respectful word for plants used in **sacred** ways, without the baggage of "drug".

The **classic psychedelics** (psilocybin, DMT, mescaline and LSD) share one main action in the brain: they work through a serotonin receptor called **5-HT2A**. See [The Brain and Consciousness](/teachings/psychedelics-and-the-brain).

## The ancient roots
- **The Vedas** of India praise **soma**, a sacred drink offered to the gods and drunk by the priests. Whole hymns of the Rig Veda are devoted to it. What plant soma was is still debated, and the answer may never be known.
- **Patanjali's Yoga Sutras** (4.1) name five sources of special powers: birth, **herbs**, mantra, discipline, and **samadhi**. The yoga tradition placed samadhi, deep absorption through practice, as the highest of them. See [Patanjali](/teachings/patanjali).
- **The Mysteries of Eleusis** in Greece were celebrated for nearly two thousand years, and initiates drank a sacred barley drink called the *kykeon*. Some scholars have suggested it contained a mind-altering substance; others disagree, and the question is unresolved. See [The Mystery Schools](/teachings/the-mystery-schools).
- **In the Americas**, the evidence is clearer: peyote buttons found in a Texas cave have been dated to almost six thousand years ago; a stone carving at **Chavín de Huántar** in Peru, from around three thousand years ago, shows a figure holding the San Pedro cactus; and the Mazatec, Shipibo, Wixárika (Huichol) and many other peoples keep living traditions to this day.

## Two different worlds
**Traditional plant medicine** is held inside a living culture: a lineage of healers, songs, prayers, a diet before and after, a community, and a purpose that is healing and relationship with the spirit world. The plant is never "the whole thing"; the ceremony and the healer's years of training are part of the medicine.

**Clinical research** studies a purified substance under strict conditions: careful medical screening, trained therapists, preparation and follow-up sessions, and measurement. Its purpose is to test whether a treatment is safe and works, for conditions such as depression.

Between these two lies a third world that is growing fast: **retreats and "ceremonies" run for visitors**, some with deep respect and skill, and some without either. The [safety page](/teachings/plant-medicine-safety) speaks honestly about this.

## The other way: no substance at all
Many paths teach that awakening comes through prayer, breath, stillness, service and love, with no substance at all. **Buddhism's fifth precept** asks followers to refrain from intoxicants that cloud the mind; **Islam** forbids intoxicants (Qur'an 5:90); much of the yoga and contemplative tradition teaches that what a plant may show for a few hours, practice can make into a lasting way of being. These paths are honoured here equally. The practices of this site, [breath](/teachings/breath-of-peace), [stillness](/teachings/meditation-and-prayer) and [gazing meditation](/teachings/trataka), are offered to everyone, and need nothing but the willing heart.

## In this section
1. [Ayahuasca: The Vine of the Soul](/teachings/ayahuasca)
2. [Psilocybin: The Sacred Mushrooms](/teachings/psilocybin-sacred-mushrooms)
3. [DMT and 5-MeO-DMT](/teachings/dmt-and-5-meo-dmt)
4. [Mescaline: Peyote and San Pedro](/teachings/mescaline-peyote-and-san-pedro)
5. [LSD: Albert Hofmann's Discovery](/teachings/lsd-hofmanns-discovery)
6. [The Brain and Consciousness: What Science Knows](/teachings/psychedelics-and-the-brain)
7. [Set, Setting and Integration](/teachings/set-setting-and-integration)
8. [Safety, Medicine Interactions and the Law](/teachings/plant-medicine-safety)` },

  { slug: "ayahuasca", tag: "Ayahuasca", title: "Ayahuasca: The Vine of the Soul",
    image: { src: "/images/plant-medicine/ayahuasca.jpg", width: 1400, height: 788, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "The twisting ayahuasca vine and green chacruna leaves on a carved wooden table, with a clay bowl, a candle and a cloth embroidered with geometric patterns" },
    summary: "The sacred brew of the Amazon: the vine and the leaf, why the two must be combined, the healers and their songs, the purge and the diet, the churches of Brazil, and what modern research has found.",
    body: `${series(2)}

**Ayahuasca** comes from the Quechua language of the Andes: *aya* means spirit, soul or the dead, and *waska* means vine or rope. It is usually translated **"the vine of the soul"** or "the vine of the dead". Peoples of the Amazon and Orinoco basins have used it in healing and ceremony since long before written records.${safetyLink}

## The vine and the leaf
Ayahuasca is a brew of two plants that work together:
- **The vine**, *Banisteriopsis caapi*. It contains alkaloids called **harmine, harmaline and tetrahydroharmine**.
- **The leaf**, most often *chacruna* (*Psychotria viridis*), or in some regions *chaliponga* (*Diplopterys cabrerana*). These leaves contain **DMT**.

## Why the two are needed together
On its own, DMT taken by mouth does almost nothing: an enzyme in the gut and liver called **monoamine oxidase (MAO)** breaks it down before it reaches the brain. The alkaloids of the vine **block this enzyme** for a few hours. They are **MAO inhibitors (MAOIs)**. With the enzyme held back, the DMT from the leaf can pass into the body and reach the brain.

How peoples of the forest discovered this partnership, among tens of thousands of plants, is one of the great questions of ethnobotany. The healers themselves often answer simply: **the plants taught them.**

This same enzyme-blocking action is why ayahuasca can be **dangerous with certain medicines**, especially many antidepressants. Please read the [safety page](/teachings/plant-medicine-safety).

## The healers and their songs
Among the **Shipibo-Conibo** people of the Peruvian Amazon, healers are trained for many years in isolation with the plants. In ceremony they sing **icaros**, healing songs said to be received from the plant spirits. The Shipibo are also known for **kené**, intricate geometric patterns painted and embroidered on cloth and pottery, which healers describe as connected to the songs and the visions. Peru declared kené part of the nation's cultural heritage in 2008.

Many peoples call ayahuasca a teacher, a grandmother or a doctor, and speak of the medicine as a living being, not a chemical.

## La purga: the purge
Vomiting is common, and in the traditions it is not seen as a side effect but as **cleansing**: the release of what is heavy, physical, emotional or spiritual. Ayahuasca is often called *la purga*, "the purge".

## La dieta: the diet
Traditional work with the plants is surrounded by a **dieta**: a period before and after, of simple food without salt, sugar, pork or alcohol, sexual abstinence, quiet and solitude. In the traditions, the dieta prepares the body and opens a relationship with the plant spirits. There may also be practical reasons, because of the MAO-inhibiting alkaloids. In longer master-plant diets, healers may spend weeks or months alone with a single plant.

## The churches of Brazil
In the twentieth century, ayahuasca became a sacrament of new Christian-influenced religions in Brazil: **Santo Daime**, founded in the 1930s by Raimundo Irineu Serra, and the **União do Vegetal (UDV)**, founded in 1961 by José Gabriel da Costa. Brazil has allowed ritual use since 1987. In 2006, the **US Supreme Court** ruled in *Gonzales v. O Centro Espírita Beneficente União do Vegetal* that the UDV could continue its sacramental use under religious freedom law.

## What modern research has found
- In 2019, a Brazilian team published the first **randomised, placebo-controlled trial** of ayahuasca, in 29 people with **treatment-resistant depression**. Those who received ayahuasca improved significantly more than those who received a placebo, already from the first day and still at one week. The study was small, and larger trials are needed.
- Other studies have explored its use for grief, trauma and addiction. Results are promising but early, and ayahuasca is **not an approved medicine** anywhere.

## Things to hold gently
- **It is not a shortcut.** The traditions describe ayahuasca as hard work, sometimes frightening, and never a substitute for the long labour of a changed life.
- **Respect for the peoples.** Demand from visitors has changed Amazon communities and their forests. Many indigenous voices ask outsiders to honour the source, the lineage and the land.

## Samadhi's view
{{pm-view}}

See also: [Set, Setting and Integration](/teachings/set-setting-and-integration) · [DMT and 5-MeO-DMT](/teachings/dmt-and-5-meo-dmt)` },

  { slug: "psilocybin-sacred-mushrooms", tag: "Psilocybin", title: "Psilocybin: The Sacred Mushrooms",
    image: { small: true, src: "/images/plant-medicine/psilocybin.jpg", width: 1000, height: 1000, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "Wild mushrooms growing from moss and old wood on a forest floor at dusk, beside a beeswax candle on a flat stone" },
    summary: "The mushrooms of the Mazatec healers, María Sabina and the night vigil, how psilocybin becomes psilocin in the body, and the clinical trials for depression and for anxiety at the end of life.",
    body: `${series(3)}

Some two hundred kinds of mushroom around the world contain **psilocybin**. In Mexico and Central America they have been part of sacred ceremony for centuries, and perhaps far longer.${safetyLink}

## Teonanácatl
When the Spanish arrived in Mexico in the sixteenth century, friars such as **Bernardino de Sahagún** recorded that the Aztecs ate sacred mushrooms called **teonanácatl** in the Nahuatl language. The name is often translated **"flesh of the gods"**, though some scholars prefer "wondrous" or "sacred mushroom". The Church tried to stamp out the practice, and it survived quietly in the mountains for four hundred years.

## María Sabina and the velada
Among the **Mazatec** people of Oaxaca, healers kept the night ceremony called the **velada**, the vigil. The most famous of them was **María Sabina** (around 1894 to 1985) of Huautla de Jiménez. Her veladas were sung prayers, mixing Mazatec chants with Christian saints; she spoke of the mushrooms as **"the little saints"** and used them to find the cause of illness and to heal.

In 1955 the American banker and amateur mycologist **R. Gordon Wasson** attended a velada, and in 1957 he described it in *Life* magazine. Thousands of outsiders then came looking for the mushrooms. María Sabina later said that from the moment the foreigners arrived, the little saints lost their purity and their power. Her story is a lesson in respect that still matters today.

## In the body
In 1958 the Swiss chemist **Albert Hofmann**, who had discovered LSD, isolated and named **psilocybin** and **psilocin** from Mexican mushrooms. In the body, psilocybin is quickly changed into **psilocin**, which is the active form. Psilocin works mainly at the brain's **5-HT2A serotonin receptor**. See [The Brain and Consciousness](/teachings/psychedelics-and-the-brain).

## The clinical trials
- In 2006, a team at **Johns Hopkins** led by Roland Griffiths published a careful study in which most volunteers rated a guided psilocybin session among the most meaningful experiences of their lives, and many described it as mystical. Two months later, they still reported lasting positive changes.
- In 2016, Johns Hopkins and **New York University** published trials with people facing **cancer**. A single guided session brought large and lasting reductions in depression and anxiety for most participants.
- Since then, larger trials have studied psilocybin for **treatment-resistant depression**. In **November 2026** the company Compass Pathways completed its application to the US Food and Drug Administration for a psilocybin treatment, after positive late-stage trials. **As of this writing it is not approved.** If approved, it would be given only in clinics, with screening and supervision.

In all these trials, psilocybin was never simply handed out. It came with **medical screening, preparation, a trained guide in the room, and support afterwards**. That container is a large part of why the results were good and the risks were managed.

## Where the law stands
Psilocybin remains illegal under US federal law and in most countries. Oregon (2020) and Colorado (2022) voters created state-regulated programmes, a few other states and countries have opened medical or limited pathways, and Australia has allowed specially approved psychiatrists to prescribe it since 2023. Laws change often. See [Safety, Medicine Interactions and the Law](/teachings/plant-medicine-safety).

See also: [Set, Setting and Integration](/teachings/set-setting-and-integration)` },

  { slug: "dmt-and-5-meo-dmt", tag: "DMT", title: "DMT and 5-MeO-DMT: Brief and Profound",
    image: { src: "/images/plant-medicine/dmt.jpg", width: 1400, height: 788, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "A dark stone wall carved with interlocking circles, lattices and spirals, glowing with golden light from within, above a single candle" },
    summary: "The molecule found in many plants and in the rat brain: its sudden, short and intense journey, the geometric visions people report, the white light of 5-MeO-DMT, and what is proven and what is not.",
    body: `${series(4)}

**DMT** (N,N-dimethyltryptamine) is found in a great many plants, including the chacruna leaf of [ayahuasca](/teachings/ayahuasca). It is one of the most powerful psychedelics known, and also one of the shortest.${safetyLink}

## A sudden, short journey
When DMT is inhaled, its effects come on within moments and usually fade within about **fifteen minutes**. People describe being carried out of ordinary reality into vivid other worlds, often filled with light, colour and complex patterns, and sometimes with the sense of meeting presences or beings. In ayahuasca, where the vine's MAO inhibitors let DMT be taken by mouth, the experience is slower and longer, lasting a few hours.

In the 1990s, the psychiatrist **Rick Strassman** gave DMT to volunteers at the University of New Mexico, in the first new US research on a psychedelic in about twenty years. He described his findings in the book *DMT: The Spirit Molecule* (2000).

## The geometry people see
Many people describe intricate geometric visions: lattices, tunnels, spirals and mandala-like patterns. Nearly a hundred years ago, the psychologist **Heinrich Klüver**, studying mescaline, noticed that the same few shapes appear again and again in visions, and called them **form constants**: gratings and lattices, cobwebs, tunnels and funnels, and spirals. Later scientists explained these shapes with mathematical models of the way the visual parts of the brain are wired.

Some seekers feel a kinship between these visions and the patterns of [sacred geometry](/teachings/the-symbols-of-sacred-geometry) found in temples across the world. That is a beautiful thought to hold, gently. It is a resonance of meaning, not a proof of anything.

## Is DMT made in the body?
- **What is known:** in 2019, a University of Michigan team found that **rat brains** can make DMT, in the cortex and other areas, at levels similar to some known brain chemicals. The genes for the enzymes involved are also found in human brain tissue.
- **What is not known:** whether the **human** brain makes DMT in meaningful amounts, and what it does if it does. The researchers themselves said they do not yet know its role.
- **What is not proven:** popular claims that the pineal gland releases floods of DMT at birth, in dreams or at death. These remain hypotheses. The same team did find that DMT rose in the rat brain after the heart stopped, which has led to research questions about near-death experiences, but nothing is settled.

## 5-MeO-DMT
**5-MeO-DMT** is a close chemical cousin found in some plants and, most famously, in the venom of the **Sonoran Desert toad** (*Incilius alvarius*). It is extremely powerful. Unlike DMT, it is usually **not** described as visual or geometric. People more often report a complete dissolving of the sense of self into boundless white light, silence or unity, sometimes described in the language of mystics: no separation, only the One.

It also carries real risks: loss of control of the body during the experience, breathing problems in rare cases, and difficult psychological after-effects for some people. Demand for toads has led conservationists and Indigenous groups of the Sonoran Desert to warn about harm to the toad and its habitat.

## Ego dissolution
Both substances are associated with **ego dissolution**: a temporary loss of the boundary between "me" and "everything". Mystics of many traditions describe something similar in deep contemplation. Science can measure that people report it; it cannot, by itself, say what it means. See [The Brain and Consciousness](/teachings/psychedelics-and-the-brain) and [Who Are the Mystics?](/teachings/who-are-the-mystics)` },

  { slug: "mescaline-peyote-and-san-pedro", tag: "Mescaline", title: "Mescaline: Peyote and San Pedro (Huachuma)",
    image: { small: true, src: "/images/plant-medicine/mescaline.jpg", width: 1000, height: 1000, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "A tall San Pedro cactus beside ancient carved stone ruins in the Andes at golden hour, with a small round peyote cactus and a woven Andean cloth" },
    summary: "The cactus medicines of the Americas: peyote and the Native American Church, the Wixárika pilgrimage to Wirikuta, San Pedro of the Andes and the stone of Chavín, and the heart-opening quality people describe.",
    body: `${series(5)}

**Mescaline** is the oldest psychedelic known to science, and the cacti that contain it may be the oldest sacred medicines in the Americas.${safetyLink}

## Peyote
**Peyote** (*Lophophora williamsii*) is a small, slow-growing, spineless cactus of the Chihuahuan Desert of Texas and Mexico.
- **Ancient use:** peyote found in Shumla Cave in Texas has been radiocarbon dated to almost **six thousand years ago**, and mescaline could still be detected in it. It is among the oldest plant medicines ever found by archaeology.
- **The Wixárika (Huichol)** people of western Mexico make a sacred pilgrimage on foot each year to **Wirikuta**, the desert where they say the sun was born, to gather peyote, which they honour together with the deer and the maize as one sacred being.
- **The Native American Church** spread across North America from the late nineteenth century. In its all-night prayer meetings, peyote is a sacrament, received with prayer, song, the drum and the sacred fire. US federal law has protected this use for members of federally recognised tribes since **1994**.
- **Conservation:** wild peyote takes many years to grow and is declining. Many Native American leaders ask non-Native people to leave peyote for the communities who hold it sacred.

## San Pedro, or Huachuma
**San Pedro** is a tall columnar cactus of the Andes. Its traditional name is **Huachuma**.
- At **Chavín de Huántar** in Peru, a great ceremonial centre of around 1200 to 400 BCE, a granite stela shows a figure holding the cactus. It is the clearest ancient image of its sacred use.
- Andean healers called *curanderos* still hold night ceremonies, working at a *mesa*, an altar of power objects. After the Spanish conquest, the cactus came to be called San Pedro, perhaps because Saint Peter holds the keys to heaven.

## The molecule
In 1897 the German chemist **Arthur Heffter** isolated mescaline from peyote, and in 1919 **Ernst Späth** made it in the laboratory. Mescaline belongs to a different chemical family from the others in this section: it is a **phenethylamine**, while psilocybin, DMT and LSD are tryptamines or related. It still acts mainly through the same 5-HT2A receptor. Its effects are slow and long, lasting many hours.

## The heart and the senses
People often describe the cactus medicines as **gentle on the heart and bright to the senses**: colours deepen, nature seems alive and radiant, and feelings of connection, gratitude and tenderness come forward. Huachuma ceremonies are often held in daylight, in nature.

## The doors of perception
In 1953, the English writer **Aldous Huxley** took mescaline under the guidance of Humphry Osmond and wrote *The Doors of Perception* (1954). He took his title from William Blake: *"If the doors of perception were cleansed every thing would appear to man as it is, infinite."* (*The Marriage of Heaven and Hell*, 1790). Huxley believed the experience gave a glimpse of what mystics describe; he also called it a gratuitous grace: not necessary to salvation, though potentially helpful.

See also: [Safety, Medicine Interactions and the Law](/teachings/plant-medicine-safety)` },

  { slug: "lsd-hofmanns-discovery", tag: "LSD", title: "LSD: Albert Hofmann's Discovery",
    image: { src: "/images/plant-medicine/lsd.jpg", width: 1400, height: 788, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "A 1940s laboratory bench with glass bottles, a brass microscope, a lamp, a notebook and stalks of rye with dark ergot, beside a window onto a quiet street with a bicycle" },
    summary: "The chemist, the ergot fungus and the bicycle ride of 1943, the hopeful psychiatric research of the 1950s and 60s, the long ban, and the new brain-imaging studies and clinical trials.",
    body: `${series(6)}

**LSD** (lysergic acid diethylamide) is not a plant medicine. It was made in a laboratory, from a substance in **ergot**, a fungus that grows on rye. Yet its story became one of the most important in the modern history of consciousness.${safetyLink}

## The discovery
In **1938**, the Swiss chemist **Albert Hofmann**, working at the Sandoz company in Basel, made LSD while searching for a medicine for circulation and breathing. Tests showed nothing useful, and it was set aside.

Five years later, in **April 1943**, Hofmann made it again, and accidentally absorbed a tiny trace. He felt a strange restlessness and saw a stream of fantastic pictures and colours. On **19 April 1943**, he took a deliberate amount to test it and, as his state changed, rode home on his bicycle. That day is still remembered as "Bicycle Day". Hofmann later called LSD his "problem child" and, to the end of his long life (he died in 2008, aged 102), spoke of it as a sacred substance that had been misused.

## The research years
Through the 1950s and early 1960s, Sandoz offered LSD to researchers under the name **Delysid**. Thousands of scientific papers were published. Psychiatrists studied it for **alcoholism**, notably in Saskatchewan, Canada, with Humphry Osmond, as well as for depression, anxiety and end-of-life distress. Many of those early studies were not as carefully designed as modern trials, but some results were striking.

## The long silence
In the 1960s, LSD spread widely outside research, often without care, and it became tied to the culture wars of the time. Frightening stories, some true and some exaggerated, filled the newspapers. The United States banned it, and in 1970 placed it in **Schedule I**, the strictest category. Most countries followed. Research almost stopped for thirty years.

## The return of research
- In **2016**, a team at Imperial College London published the first images of the **human brain on LSD**, using several kinds of scanning. They saw the visual cortex communicating with far more of the brain than usual, and a loosening of the brain's **Default Mode Network**, linked in volunteers to the feeling of ego dissolution. See [The Brain and Consciousness](/teachings/psychedelics-and-the-brain).
- Since then, LSD has been studied in controlled trials for **anxiety** and **depression**, and large late-stage (phase 3) trials have been under way. **As of this writing it is not an approved medicine.**

## A lesson from its story
LSD's history shows how a powerful tool can be studied with care, then lost to careless use and fear, then slowly returned to careful study. Its story teaches how much [set and setting](/teachings/set-setting-and-integration) matter.

See also: [Safety, Medicine Interactions and the Law](/teachings/plant-medicine-safety)` },

  { slug: "psychedelics-and-the-brain", tag: "Neuroscience", title: "The Brain and Consciousness: What Science Knows",
    image: { small: true, src: "/images/plant-medicine/brain.jpg", width: 1000, height: 1000, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "An antique ivory and gold-leaf model of the human brain with fine golden lines of light, beside an old book, a candle and brass dividers" },
    summary: "The serotonin 5-HT2A receptor, the quieting of the Default Mode Network, new connections between brain regions and the growth of new links between nerve cells, explained simply, with what is proven kept apart from what is still a hypothesis.",
    body: `${series(7)}

What happens in the brain during a psychedelic experience? Science has learned a great deal in the last twenty years, and there is still far more it does not know. On this page, **what is well established**, **what is supported but still being studied**, and **what is hypothesis** are kept clearly apart.${safetyLink}

## Well established
- **The 5-HT2A receptor.** The classic psychedelics (psilocybin, DMT, mescaline and LSD) all work mainly by switching on a type of serotonin receptor called **5-HT2A**. These receptors are especially dense in the brain's outer layer, the cortex, where perception and thought take shape. When volunteers are first given a medicine that blocks this receptor, the psychedelic effects largely disappear.
- **Different chemicals, one door.** Despite their different structures, all four enter the mind's experience mainly through this same door.

## Supported, still being studied
- **The Default Mode Network quiets.** The **Default Mode Network (DMN)** is a group of brain regions that is most active when we are not focused on a task: daydreaming, thinking about ourselves, remembering the past and worrying about the future. Some call it the seat of the "story of me". In brain-imaging studies, psilocybin and LSD loosen the usual tight working of this network, and in several studies the degree of loosening matched how strongly volunteers felt their sense of self dissolve. Meditation research has also found the DMN to be quieter in experienced meditators, a meeting point worth noting.
- **More cross-talk.** Brain regions that usually work in separate teams begin to communicate more widely with one another. Researchers think this may relate to the blending of senses, new perspectives and unusual associations people describe.
- **Neuroplasticity.** In laboratory studies of nerve cells and in animals, psychedelics encourage nerve cells to grow **new branches and connections**. Scientists are studying whether this helps explain why one or two guided sessions can sometimes lead to lasting change in people. It is a promising idea, still being tested in humans.

## Hypotheses (not yet proven)
- **The "entropic brain".** One leading theory proposes that psychedelics make brain activity more varied and less predictable, loosening rigid habits of thought and allowing them to be reshaped. It is influential, debated, and not proven.
- **Consciousness beyond the brain.** Some people feel that what they experienced was more real than ordinary life, or that consciousness is not produced by the brain at all. These are profound questions of philosophy and faith. Brain studies can show what changes in the brain; they cannot prove or disprove where consciousness comes from.

## Meaning matters
In the clinical trials, people who described a deeply **meaningful** or **mystical-type experience** often improved most. This suggests that what happens in the heart and mind, not only the chemistry, is part of the healing. Science and the traditions meet here: the experience matters, and so does what we do with it afterwards. See [Set, Setting and Integration](/teachings/set-setting-and-integration).

## Read wisely
Popular articles often overstate brain science. A brightly coloured brain scan is a measurement, not a revelation. For how to weigh claims, see [Discernment](/teachings/discernment).` },

  { slug: "set-setting-and-integration", tag: "Integration", title: "Set, Setting and Integration",
    image: { small: true, src: "/images/plant-medicine/integration.jpg", width: 1000, height: 1000, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "An open handwritten journal with a fountain pen, a candle, a cup of tea and a small plant on a wooden table by a window at sunrise" },
    summary: "Why the mind you bring and the place you are in shape the whole experience, and why what you do afterwards matters most: grounding insights through journaling, breath, stillness and the habits of daily life.",
    body: `${series(8)}

Researchers and traditional healers agree on one thing more than any other: **the substance is only one part of the experience.** The person and the place matter just as much, and what happens afterwards may matter most of all.${safetyLink}

## Set: the mind you bring
**Set** means your mindset: your intention, your mood, your expectations, your fears, your health and your history. A person who is frightened, exhausted, in crisis or simply curious for thrills brings a very different set from a person who has prepared carefully, with a clear and humble intention.

## Setting: where and with whom
**Setting** means the physical, social and cultural surroundings: the room or the forest, the people present, the music, the sense of safety, and the tradition or framework that holds it. In a ceremony, the setting includes the healer, the songs and the prayers. In a clinical trial, it includes the medical team and a calm, prepared room.

## Where the idea comes from
Researchers of the 1950s and early 1960s noticed that the same substance could bring very different experiences to different people in different places. The phrase **"set and setting"** was made famous by **Timothy Leary** and his colleagues in the early 1960s, and set out in their 1964 book *The Psychedelic Experience*. The Harvard psychiatrist **Norman Zinberg** developed it with careful research in his book *Drug, Set, and Setting* (1984), showing how deeply culture and circumstance shape any drug experience.

## Integration: what comes after
**Integration** means bringing insight down into daily life: understanding the experience, making peace with what was hard in it, and letting what was true change how we live. Without integration, even a profound experience can fade like a dream, or leave a person confused and unsettled.

Many people find these helpful:
- **Journaling.** Write it down soon, in your own words, before the mind tidies it up. Then return to it weeks later.
- **Stillness.** A few quiet minutes each day keep the door open. See [Meditation and Prayer](/teachings/meditation-and-prayer) and [Trataka](/teachings/trataka).
- **Breath.** Slow breathing calms the body and the mind when old feelings rise. See [Breath of Peace](/teachings/breath-of-peace).
- **Sitting with questions.** Let one insight become a question you live with. See [Questions to Sit With](/teachings/questions-to-sit-with).
- **Nature, rest and simple routines.** Sleep, walks, good food and time outdoors help the nervous system settle.
- **Wise companions.** Speak with someone trustworthy: a counsellor, a therapist, a spiritual teacher, or an integration circle. If old wounds rise strongly, a qualified therapist can help.
- **Philosophy and the traditions.** The great teachers can give words to what was beyond words. See [What Is Philosophy?](/teachings/what-is-philosophy) and [Who Are the Mystics?](/teachings/who-are-the-mystics)
- **Changed actions.** The truest sign of integration is a kinder, more honest, more grounded daily life.

## A word from the traditions
The mystics of every faith say that a vision is a beginning, not an arrival. What was glimpsed must be lived, slowly, through love, patience and practice. The same breath, stillness and service that help integration are also, for many, a complete path of their own.` },

  { slug: "plant-medicine-safety", tag: "Safety", title: "Safety, Medicine Interactions and the Law",
    image: { src: "/images/plant-medicine/safety.jpg", width: 1400, height: 788, caption: "AI-painted artwork for SAMADHI LOVE.", alt: "An old apothecary cabinet of dark wood with brass-handled drawers, amber glass bottles, a brass balance scale, a book of laws and a candle" },
    summary: "Plain, non-judgmental safety information: dangerous medicine interactions (especially ayahuasca with antidepressants), who should not take psychedelics, psychological risks, choosing trustworthy people, and the legal situation.",
    body: `${series(9)}

This page is here because people deserve honest information. It is **education, not medical, legal or professional advice**, and it does not encourage anyone to take any substance.

> **If someone is in danger right now**, call your local emergency number (in the US, **911**). If you are struggling emotionally, in the US you can call or text **988** at any time.

## Dangerous medicine interactions
**Always speak with a doctor before combining anything with prescribed medicines, and never stop a prescribed medicine on your own:** stopping some antidepressants suddenly is itself risky.

**Ayahuasca and other MAO inhibitors.** The vine in ayahuasca blocks the enzyme MAO. Combined with medicines or substances that raise serotonin, this can cause **serotonin syndrome**, which can be life-threatening. Signs include agitation, confusion, fever, sweating, shivering, muscle twitching or rigidity, and a racing heart. Combinations of special concern include:
- **SSRIs and SNRIs** (many common antidepressants), and **MAOI antidepressants**
- **Tricyclic antidepressants**, **lithium**, **tramadol** and some other painkillers
- **Stimulants** (including amphetamines, cocaine and MDMA) and some cold and cough medicines (such as dextromethorphan)
- **St John's wort** and some other herbal remedies

The vine's MAO-inhibiting effect wears off within a day or two, but some medicines stay in the body for weeks. Only a doctor who knows your medicines can advise you.

**Food.** Older MAOI medicines can cause a dangerous rise in blood pressure (a **hypertensive crisis**) with foods rich in **tyramine**, such as aged cheeses, cured or fermented meats, and some fermented foods and drinks. The vine's MAO inhibition is shorter and milder, but traditional diets avoid such foods, and this is one practical reason why.

**Lithium.** A 2021 study of people's own online reports found **seizures** in nearly half of the accounts of lithium combined with classic psychedelics such as psilocybin or LSD.

## Who should not take psychedelics
Clinical trials exclude people who have:
- A personal or **family history of psychosis or schizophrenia**, or of **bipolar disorder (mania)**. Psychedelics can trigger lasting episodes in people at risk.
- **Heart disease, high blood pressure** or a history of stroke. Psychedelics raise heart rate and blood pressure, ayahuasca especially.
- A history of **seizures**.
- **Pregnancy** or breastfeeding.

## Psychological risks
- **Difficult experiences** ("bad trips"): intense fear, confusion, grief or terror. Most pass with the experience, especially with calm support, but some leave lasting distress.
- **Destabilisation:** some people feel anxious, disconnected or shaken for days, weeks or longer afterwards, especially without support. This is why [integration](/teachings/set-setting-and-integration) matters.
- **Risky behaviour:** accidents, falls and getting lost happen. Never drive, swim or be near heights or water under the influence.
- **Lasting visual changes:** a small number of people report long-lasting changes in vision after psychedelics (sometimes called HPPD).

## Retreats and facilitators
Not every person offering a "ceremony" is trustworthy. There have been reports of **sexual abuse and exploitation** of vulnerable guests by some facilitators, of brews mixed with **other, dangerous plants**, and of **deaths** at unregulated retreats. Signs of care include:
- **Careful medical screening** before anything is offered, with honest questions about your health and medicines
- **Trained, experienced** people, with real accountability and someone medically qualified available
- **Never being pressured**, rushed, isolated, or asked for money, secrecy or physical closeness
- Respectful **relationship with the source community**, and support **afterwards**

If something feels wrong, you are always free to say no and to leave.

## The law
- In the **United States**, psilocybin, DMT, mescaline, peyote and LSD are **Schedule I** controlled substances under federal law: illegal to possess, grow, sell or give away, with serious penalties.
- **Religious exemptions** exist for specific groups: members of the **Native American Church** for peyote (federal law since 1994), and some churches for ayahuasca following court cases such as the Supreme Court's 2006 *O Centro* decision.
- **Oregon** and **Colorado** have created state-regulated programmes for supervised psilocybin use (Colorado's also covers some other natural psychedelics), and some cities and states have reduced penalties. These do not change federal law.
- **Australia** has allowed specially authorised psychiatrists to prescribe psilocybin for certain conditions since 2023. Some other countries allow limited medical or religious use.
- In **most countries**, these substances remain illegal. Laws change often: always check the current law where you are.

## A last word
The safest path is always the one that needs no substance: [breath](/teachings/breath-of-peace), [stillness](/teachings/meditation-and-prayer), prayer, nature and love. Whatever path a person chooses, may it be walked with honesty, care and respect for life.` },
];

// Words for the Glossary: [term, pronunciation, language, meaning, link].
export const plantMedicineGlossary = [
  ["Ayahuasca", "eye-uh-WAH-skuh", "Quechua", "\"Vine of the soul\": the sacred Amazonian brew of a vine and a DMT-containing leaf, used in healing and ceremony.", "/teachings/ayahuasca"],
  ["Default Mode Network", "dee-FAWLT mohd NET-wurk", "English", "Brain regions most active when the mind wanders or thinks about itself; psychedelics and deep meditation quiet them.", "/teachings/psychedelics-and-the-brain"],
  ["Entheogen", "en-THEE-oh-jen", "Greek", "\"God generated within\": a plant or substance used in sacred, spiritual ways.", "/teachings/plant-medicine-overview"],
  ["Integration", "in-tuh-GRAY-shun", "English", "Bringing the insights of a powerful inner experience into daily life through reflection, practice and support.", "/teachings/set-setting-and-integration"],
  ["MAOI", "em-ay-oh-EYE", "English", "Monoamine oxidase inhibitor: a substance that blocks an enzyme that breaks down serotonin and DMT; dangerous with many medicines.", "/teachings/plant-medicine-safety"],
  ["Set and Setting", "set and SET-ing", "English", "The mindset a person brings and the place and people around them, which together shape any psychedelic experience.", "/teachings/set-setting-and-integration"],
];
