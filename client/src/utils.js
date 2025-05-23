
export const getRandomLoadingMessage = () => {
    const action_list = ['booting', 'cracking', 'hyperadjusting', 'importing telemetry for',
        'cyberhammering', 'figuring out', 'adjusting malfeasance in', 'puttering about with',
        'monkeying with', 'unfluffing', 'tenderizing', 'reticulating', 'iterating',
        're-iterating', 'de-iterating', 'calculating', 'foraging for', 'importing configs from',
        'faffing about with', 'delineating', 'calculating atomic weight for', 
        'establishing emotional bond with', 'maintaining good relations with',
        'synergizing', 'repairing strained relationship with', 'eating', 'digesting',
        'hiding footprints of', 'de-masticating', 'pulling index for', 'non-euclidifying',
        'rooting', 'un-rooting', 'sowing', 'techno-spraying', 'pounding', 'apologizing for',
        'cyber-oiling', 'quantum lubricating', 'quantum de-escalating', 'explaining things to',
        'finding excuses for', 'maintaining phase array within', 'ejecting', 
        'recycling', 'auditioning', 'quantum tangentifying', 'enlightening', 'obscuring',
        'rectifying', 'bringing home', 'calling for', 'on hold with', 'establishing neural uplink to',
        'phasing neural uplink for', 'contacting', 'beaming', 'artificing', 'pinging',
        'smothering', 'load balancing', 'unbalancing load for', 'calcuating ideal loading message for',
        'finding the square root of', 'formatting', 'attempting to run Doom with', 
        'using', 'abusing', 'establishing boundaries for', 'distancing oneself from', 
        'codifying', 'conditioning', 'cross-training', 'specializing', 'certifying', 
        'carbon-dating', 'allowing', 'airing out', 'engaging', 'engaging with', 
        'engaging engagement for', 'guillotining', 'defenestrating', 'yanking on', 
        'finding', 'finding out about', 'learning about', 'teaching someone about',
        'training', 'bootstrapping', 'orphaning', 'widowing', 'widowering', 'winnowing',
        'flattering', 'flattening', 'fattening', 'forge-welding', 'making amends with',
        'befriending', 'unfriending', 'unloading', 'trashing', 'recycling', 'upcycling',
        'unflattering', 'unflattening', 'unfattening', 'nattering on about', 'going on about',
        'blathering to', 'blathering about', 'blathering on about', 'continuing to blather about',
        'teaching chess to', 'teaching ping-pong to', 'unpinging', 'de-pinging', 'degloving', 
        'de-blathering', 'de-bloating', 'bloating', 'unbloating', 'rebloating', 'sub-bloating',
        'hyperscaling', 'nanoscaling', 'nanopinging', 'nanoforging', 'nano-dithering', 
        'quantum dithering', 'quantum scaling', 'explaining The Room to', 'explaining The Matrix to',
        'explaining quantum theory to', 'explaining Twilight to', 'explaining human emotion to',
        'logging emotional state of', 'logging win-loss ratio of', 'logging quantum dithering for',
        'knowing', 'finding known knowns of', 'unlearning', 'unknowing', 'relearning',
        'establishing squishiness of', 'establishing fluffiness of', 'establishing alibi for',
        'establishing LLC for', 'establishing legal case for', 'establishing possibility of',
        'denying any knowledge of', 'denying any affection for', 'denying proximity to',
        'establishing proxmimity to', 'distancing child processses from', 'digitizing',
        'de-digitizing', 'invigorating', 'unvigorating', 'establishing lactose tolerance of',
        'quantum unvigorating', 'quantum revigorating', 'pseudo-encrypting', 'pseudo-decrypting',
        'telling secrets to', 'attempting to reason with', 'establishing governability for',
        'setting conditions for', 'processing', 'pseudo-processing', 'nano-processing', 
        'quantum processing', 'quantum diving into', 'farting around with', 'taking the piss out of',
        'de-codifying', 'quantum encoding', 'pseudo-encoding', 'pseudo-decoding', 'pseudo-bloating',
        'ossifying', 'de-ossifying', 'pseudo-ossifying', 'nano-ossifying', 'being rude to',
        'stretching', 'pseudo-stretching', 'quantum stretching', 'oscillating', 'de-oscillating',
        'un-oscillating', 'nano-oscillating', 'pseudo-oscillating', 'establishing 1337ne55 of',
        'establishing credibility of', 'questioning credibility of', 'denying credibility of',
        'denying membership to', 'denying citizenship to', 'coming clean about', 'coming clean about feelings regarding',
        'putting good vibes out for', 'putting bad vibes out for', 'vibe-checking', 
        'blowing gently on', 'brushing up against', 'avoiding contact with', 'incorporating',
        'decorporating', 'disapparating', 'determining rhizomal composition of', 
        'determining properties of', 'determining culpability of', 'determining purpose of',
        'determining length of', 'determining configuration for', 'establishing naughtiness of',
        'determining height of', 'determining width of', 'determining volume of', 
        'determining weight of', 'determining quantum state of', 'data-mining', 
        'extorting', 'debriefing', 'un-debriefing', 're-debriefing', 'anti-debriefining',
        'creating new sub-routine for', 'creating', 'un-creating', 'recreating', 'de-creating',
        'evaluating nutritional content of', 'evaluating quantum content within', 'evaluating pseudo-encryption standards for',
        'giving root access to', "giving membership of group 'wheel' to", 'exercising',
        'exorcising', 'exacerbating', 'un-exacerbating', 'de-exacerbating', 're-exacerbating',
        'quantum tunneling', 'observing', 'un-observing', 're-observing', 'un-re-observing',
        'escalating', 'de-escalating', 're-escalating', 'un-escalating', 'un-de-escalating', 
        'translating', 'de-translating', 're-translating', 'un-retranslating', 'un-detranslating',
        'quantum translating', 'quantum de-translating', 'quantum re-translating', 'restraining',
        'applying constraints to', 'unapplying constraints on', 'disapplying quantum constraints for',
        'applying floral preference to', 'applying qauntum preference to', 'applying escalation preferences to',
        'unhinging', 'hinging', 're-hinging', 'changing', 'pseudo-channeling', 
        'channeling', 're-channeling', 'de-channeling', 'un-channeling', 'quantum channeling',
        'summing', 'pseudo-summing', 'quantum summing', 'quantum scumming', 'thrimbaling',
        'de-thrimbaling', 'pseudo-thrimbaling', 'un-dethrimbaling', 're-dethrimbaling', 're-thrimbaling',
        'un-thrimbaling', 'undoing', 'save scumming', 'pseudo save-scumming', 'committing',
        'de-committing', 'attempting quantum committal of', 'attempting quantum de-committal of',
        'de-fragging', 're-fragging', 'un-fragging', 'fragging', 'un-defragging', 'quantum defragging',
        'quantum un-defragging', 'pseudo-defragging', 'pseudo-refragging', 'fucking with',
        'un-fucking', 'unscrewing', 're-screwing', 'rescuing', 'de-scrambling', 'unscrambling', 
        'under-scrambling', 'undercooking', 'cooking', 'preparing', 'unpreparing', 'disarming',
        'quantum-disarming', 'quantum scrambling', 'quantum dilating', 'dialing into', 
        'phoning', 'describing', 'generating configs for', 'generating trust for',
        'establishing trust in', 'governing', 'detecting', 'undetecting', 're-detecting', 
        'pseudo-detecting', 'super-detecting', 'undeleting save files for', 'deleting save files for',
        'redacting saved state of', 'redacting', 'un-redacting', 're-redacting', 're-re-redacting',
        'penetrating', "setting state 'ungovernable' for", 'setting up', 'tearing down',
        'making amends for', 'making peace with', 'making excuses for', 'super-positioning',
        'un-superpositioning', 'believing', 'unbelieving', 'trusting', 'untrusting',
        'being wary of', 'becoming suspicious of', 'reducing suspicious output of',
        'determining veracity of', 'determining trust in', 'finding out more about',
        'delivering', 'undelivering', 're-delivering', 'un-redelivering', 'submerging',
        'gently poking', 'gently assessing', 'asserting', 'unasserting', 'reasserting',
        'pushing', 'pulling', 'poking', 'hyperstretching', 'refactoring', 'unfactoring', 
        'defactoring', 'un-refactoring', 're-refactoring', 'un-defactoring', 'teaching definitions to',
        'teaching manners to', 'establising cleanliness of', 'networking', 'compromising',
        'uncompromising', 'de-compromising', 'quarantining', 'un-quarantining', 're-quarantining',
        'testing', 're-testing', 'untesting', 'touching', 'cataloguing', 'tracking', 'translating',
        're-translating', 'governing', 'ungoverning', 'hypothesizing', 'un-hypothesizing', 'doofing',
        'undoofing', 'redoofing', 'dedoofing', 'regoverning', 'ungoverning']

    const object_list = ['load arguments', 'toughnut.dll', 'property', 'theory', 'dithers',
            'foray', 'flowerchild', 'array', 'phase array', 'pseudo-array', 'unmentionables', 
            'quantum array', 'quantum state', 'goatse.jpg', 'lemonparty.jpg', 'fursona.bak',
            'fursona.pub', 'messages', 'config file', 'bootstrapper', 
            'rule_34_links.md', "folder 'D.Va Cosplay pics'", 'file folders', 'file location',
            'location', 'superposition', 'daemons', 'butter.py', 'container', 'applications', 
            'load order', 'pictures', 'music', 'network settings', 'backups', 'avaliability',
            'unavailability', 'foragability', 'phase', 'function', 'foundation', 'pastebin',
            'process', 'stall-state', "folder 'Star Wars Fanfics'", 'theories', 'files', 'OOB operations',
            'state', 'undiscoverables', 'monkeyfight.gif', 'load screen', 'bootloader', 'boot path',
            'mount location', 'flappables', 'stretchables', 'fattenables', 'unfattenables', 
            'compressables', 'jimmy hats', 'frog functions', 'toad functions', 'planes', 
            'architectures', 'formats', 'splines', 'gimbals', 'thrimbals', 'himbo potential',
            'potential', 'potentials', 'borrowers', 'malfeasance', 'negligence', 'snapshots',
            'subvolumes', 'subdirectories', 'subroutines', 'sub-functions', 'superfunctions',
            'malfunctions', 'order of things', 'jibblies', 'jellies', 'jiggerties', 'properties',
            'pronouns', 'gender', 'flubbables', 'bloopers', 'effables', 'ineffables', 'scripts',
            'rations', 'h4x0rm@n', 'password', 'passphrase', 'token', 'fish-petting', 'cubables',
            'questionables', 'unquestionables', 'RAID10 array', "Roko's basilisk", 'kernel', 
            'pseudokernel', 'superkernel', 'anti-kernel', 'flubbability', 'bona fides', 'signature',
            'signing key', 'signature key', 'anti-signature', 'encryptables', 'unencryptables', 'decryptables',
            'un-decryptables', 'duplicates', 'unduplicates', 'undirectories', 'anti-jibblies',
            'load state', 'load token', 'unfunction', 'hashes', 'unhashes', 'delineations',
            'undileneations', 'actions', 'unactions', 'anti-actions', 'anti-hashes', 'key',
            'cybersplines', 'meta-thrimbals', 'meta-splines', 'meta-keys', 'keys',
            'possibilities', 'meta-possibilities', 'unpossibilities', 'untoken', 'meta-token',
            'meta-folders', 'quasi-phase', 'load phase', 'load settings', 'backup settings',
            'reductive logic', 'deductive logic', 'reductive thinking', 'reductive splines',
            'meta-architectures', 'meta-states', 'quasi-thrimbals', 'unthrimbals', 'thrimbal-phases',
            'byte guards', 'bit guards', 'bit states', 'meta-bits', 'bits', 'bits and bobs', 
            'bits and pieces', 'chunks', 'unchunks', 'meta-chunks', 'meta-loader', 'anti-loader',
            'unconfigurations', 'meta-potentials', 'meta-configs', 'unconfigs', 'meta-configurations',
            'meta-files', 'root files', 'root purposes', 'meta-purposes', 'financial state',
            'dephased state', 'neuro-thrimbals', 'neuro-chunks', 'neuro-functions', 'neuro-guards',
            'meta-functions', 'pseudo-functions', 'pseudo-flappables', 'pseudo-jibblies',
            'pseudo-thrimbals', 'pseudo-pronouns', 'pseudo-configs', 'pseudo-phase', 'pseudo-availiability',
            'pseudo-dithers', 'pseudo-possibilities', 'meta-dithers', 'meta-possibilities', 
            'meta-borrowers', 'pseudo-borrowers', 'pseudo-messages', 'pseudo-flubbability',
            'meta-flubabbility', 'stretchability', 'potentiotomies', 'pseudo-functions', 
            'load functions', 'meta-loads', 'meta-load', 'meta-borrowed', 'meta-music',
            'meta-theory', 'dark secrets', 'open secrets', 'pseudo-secrets', 'meta-secrets',
            'unsecrets', 'meta-questionables', 'pseudo-questionables', 'meta-questions',
            'pseudo-questions', 'questions', 'answers', 'meta-answers', 'pseudo-answers',
            'pseudo-balls', 'meta-balls', 'meta-answerables', 'pseudo-answerables',
            'answerables', 'known knowns', 'known unknowns', 'unknown unknowns', 'pseudo-unknowns',
            'pseudo-knowns', 'meta-unknowns', 'meta-knowns', 'meta-rootables', 'pseudo-rootables',
            'quantum subvolumes', 'atmospheric token', 'stylisms', 'styles', 'meta-styles',
            'pseudo-styles', 'pseudo-stylisms', 'meta-stylisms', 'quasi-styles', 'quasi-stylisms',
            'quasi-questions', 'quasi-answers', 'quasi-logic', 'logic', 'meta-logic', 'pseudo-logic',
            'anti-logic', 'unlogic', 'pseudo-unlogic', 'unactions', 'unfolders', 'undaemons',
            'pseudo-daemons', 'meta-daemons', 'quasi-daemons', 'bit daemons', 'angry daemons',
            'daemons', 'load daemons', 'superdaemons', 'supertoken', 'supervolumes', 'volumes',
            'partition', 'meta-partition', 'quasi-partition', 'pseudo-partition', 'meta-subvolume',
            'meta-subvolumes', 'quasi-subvolume', 'quasi-subvolumes', 'pseudo-subvolume',
            'bytes', 'kilobytes', 'megabytes', 'gigbytes', 'terabytes', 'petabytes', 'untellables',
            'known knowables', 'known unknowables', 'unknown unknowables', 'meta-knowables',
            'meta-unknowables', 'pseudo-knowables', 'pseudo-unknowables', 'roots', 'pseudo-roots',
            'quantum roots', 'bit rot possibility', 'degradation possibility', 'collapse probability',
            'pseudo-collpasibles', 'meta-collpasibles', 'quasi-collaspibles', 'collapsibles',
            'collapsibility', 'meta-collapsibility', 'pseudo-collapsibility', 'anti-collapsibility',
            'uncollapses', 'uncollapsibility', 'unstate', 'meta-unstate', 'pseudo-unstate',
            'meta-bits', 'meta-bytes', 'pseudo-bits', 'pseudo-bytes', 'pseudo-salts', 'hypersalts',
            'hyperfocus', 'pseudo-focii', 'pseudo-focuse', 'quasi-focus', 'quasi-focii', 'meta-focus',
            'meta-focii', 'pseudo-degradation', 'undegradation', 'meta-degradation', 'metaphors',
            'metaphoricals', 'modalities', 'modality', 'pseudo-modality', 'meta-modality',
            'pseudo-modalities', 'meta-modalities', 'unmodality', 'unmodalities', 'quasi-modality',
            'quasi-modalities', 'quasi-degradation', 'quasi-knowables', 'quasi-unknowables',
            'quasi-possibilities', 'infinite possibilities', 'wisdom', 'wise old daemon',
            'delienquency', 'tarballs', 'doofballs', 'hairballs', 'dust bunnies', 'cobwebs',
            'cobwebbables', 'cobwebability', 'webability', 'weeb shit', 'weeb stuff', 'quasi-weeb shit',
            'fursonas', 'fursonalities', 'doofles', 'doofalities', 'doofishness', 'doofables',
            'undoofables', 'doof loader', 'doof unloader', 'path=/etc/doof', 'path=/etc/thrimbals', 'path=/bin/doof', 'path=/bin/thrmbl', 'path to /doofs', 'path to /undoofs', 
            'paths to thrimbal locations', 'paths to doof locations', 'paths to infinte possibilties',
            'path to finite possibilities', 'paths to collapsibility', 'pseudo-paths to infinite unpossibilities',
            'directors', 'pseudo-directors', 'meta-directors', 'paths to meta-possibilities',
            'infinite improbability drive', 'infinite improbability driver', 'froods', 'meta-froods',
            'hoopy froods', 'pseudo-froods', 'meta-improbabilities', 'paths to meta-improbabilities',
            'paths to quasi-improbabilities', 'paths to questionable taste', 'paths to questionable material',
            'paths to darkness', 'paths to the undoofable', 'token paths', 'pseudo-token paths',
            'root doofability', 'root thrimability'
            ]

    return action_list[Math.floor(Math.random() * action_list.length)] + ' ' + object_list[Math.floor(Math.random() * object_list.length)]
}