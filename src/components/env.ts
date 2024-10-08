import { nip19 } from 'nostr-tools';

export const imageProxy = import.meta.env.VITE_IMAGE_PROXY || 'https://images.slidestr.net';

export const appName = import.meta.env.VITE_APP_NAME || 'slidestr.net';

export const publicUrl = import.meta.env.VITE_PUBLIC_URL || 'https://slidestr.net';

type Topic = {
  name?: string;
  tags: string[];
  description?: string;
  nsfw?: boolean;
};

/* All posts with the following hashtags are flagged as adult / NSFW are not shown
   by default. Users can enable this content through the adult content flag
   in the UI or through a URL parameter. 
*/
export const adultContentTags = [
  'adult',
  'ass',
  'blowjob',
  'boobs',
  'boobstr',
  'buttstr',
  'erostr',
  'erotic',
  'freethenipple',
  'friskyfriday',
  'humpday',
  'kink',
  'kinkstr',
  'lolita',
  'milf',
  'naked',
  'nakedart',
  'nasstr',
  'nodestr',
  'naughty',
  'nsfw',
  'nude',
  'nudeart',
  'nudes',
  'cumshot',
  'doggysex',
  'onlyfans',
  'orgasm',
  'porn',
  'pornhub',
  'pornstr',
  'pussy',
  'sex',
  'sexy',
  'suicidegirls',
  'thighstr',
  'teenstr',
  'tits',
  'titstr',
  'xxx',
  'nostrqueen',
  'cum',
  'masturbation',
];

export const topics: { [key: string]: Topic } = {
  nostriga: {
    name: 'Baltic Honey Badger 2024 / NOSTRIGA',
    tags: ['nostriga', 'balticbadger', 'honeybadger', 'riga', 'bh2024', 'hb2024'],
  },
  art: {
    name: 'Art',
    tags: [
      'art',
      'artstr',
      'beautiful',
      'colorful',
      'digitalart',
      'fediart',
      'fineart',
      'mastoart',
      'mastodonart',
      'painting',
      'psychedelic',
      'zeichnen',
    ],
  },
  aiart: {
    name: 'AI Art',
    tags: [
      'aiart',
      'aiartists',
      'aiartwork',
      'automatic1111',
      'generativeart',
      'imgnai',
      'midjourney',
      'midjourneyart',
      'stablediffusion',
    ],
  },
  photography: {
    name: 'Photography',
    tags: [
      'fujifilm',
      'landscapephotography',
      'moodoftheday',
      'naturephotography',
      'photo',
      'photobook',
      'photography',
      'photos',
      'photostr',
      'picoftheday',
      'picstr',
      'streetphotography',
    ],
  },
  memes: { name: 'Memes', tags: ['meme', 'memes', 'memestr', 'nostrmemes'] },
  animals: { name: 'Animals', tags: ['catstr', 'dogstr', 'animal', 'animals', 'bird', 'birds', 'pets'] },
  lifestyle: {
    name: 'Lifestyle',
    tags: [
      'fashion',
      'flowerstr',
      'bloomscrolling',
      'style',
      'weedstr',
      'happy',
      'life',
      'love',
      'tattoo',
      'tattoowomen',
    ],
  },
  travel: {
    name: 'Travel',
    tags: [
      'beach',
      'camping',
      'hiking',
      'nature',
      'ocean',
      'travel',
      'travelgram',
      'travelling',
      'travelstr',
      'vacation',
      'vanlife',
    ],
  },
  food: {
    name: 'Food / Cooking / Baking',
    tags: [
      'baking',
      'bbq',
      'breadstr',
      'breakfast',
      'cake',
      'carnivorediet',
      'cooking',
      'dessert',
      'dessertporn',
      'dinner',
      'ferment',
      'finedining',
      'foodchain',
      'foodie',
      'foodporn',
      'foodstr',
      'ketodiet',
      'lowcarb',
      'lunch',
      'lunchchain',
      'meatstr',
      'noodle',
      'pasta',
      'pizza',
      'plantbased',
      'proofofsteak',
      'sandwich',
      'sourdough',
      'vegan',
      'yumstr',
    ],
  },
  gardenandfarm: {
    name: 'Gardening und Farming',
    tags: ['gardening', 'gardenstr', 'nature', 'farming', 'farmstr', 'flowerstr', 'bloomscrolling'],
  },
  bitcoin: {
    name: '₿itcoin',
    tags: ['bitcoin', 'plebchain', 'hfsp', 'btfd', 'buythedip', 'strike', 'bitaxe', 'bitaxegobrrr'],
  },
  nostr: { name: 'Nostr', tags: ['coffeechain', 'nostr', 'zapathon', 'grownostr', 'freedom', 'purple'] },
  bitcoinatlantis: {
    name: 'Bitcoin Atlantis / Madeira',
    tags: ['atlantis', 'bitcoinatlantis', 'madeira', 'btcatlantis', 'soveng', 'funchal', 'freemadeira', 'ba24'],
  },
  btcprague: {
    name: 'BTC Prague',
    tags: ['btcprague', 'BTCPrague', 'devhackday', 'prague', 'praha'],
    description: 'All images/videos with related hashtags #btcprague #prague #praha',
  },
  nsfw: {
    name: 'NSFW / Adult Content',
    tags: adultContentTags,
    nsfw: true,
  },
};

export const defaultHashTags = [
  'artstr',
  'catstr',
  'coffeechain',
  'dogstr',
  'flowerstr',
  'foodstr',
  'gardenstr',
  'grownostr',
  'nostr',
  'photography',
  'photostr',
  'picstr',
  'plebchain',
  'travelstr',
  'zapathon',
];

export const visibleHashTags = [
  'art',
  'artstr',
  'beautiful',
  'bitcoin',
  'catstr',
  'coffeechain',
  'colorful',
  'cute',
  'dogstr',
  'fashion',
  'flowerstr',
  'foodstr',
  'freedom',
  'gardening',
  'gardenstr',
  'grownostr',
  'happy',
  'life',
  'love',
  'nature',
  'naturephotography',
  'nostr',
  'photo',
  'photography',
  'photos',
  'photostr',
  'picoftheday',
  'picstr',
  'plebchain',
  'psychedelic',
  'streetphotography',
  'style',
  'travel',
  'travelstr',
  'zapathon',
];

/* These are shown when using tags but hidden from global (unless NSFW content is enabled) */
export const mixedAdultNPubs = [
  'npub12jedfuhk2wfr7syr38t2f55652khuyz9f88r63ftm0j2vudxq9sqq7677r', // Erikha
  'npub1x427a8qed5v8a7awj6t5lrdhkc7mp92nd2n3lgnq7p0qn9uttrrs9rfzz4', // Kimiko
];

/* These profiles are flagged as adult / NSFW and their content is not shown
   by default. Users can enable their content through the adult content flag
   in the UI or through a URL parameter. 
*/
export const adultNPubs = [
  'npub10l8k2vx4f6mxjwf9ds2tufyl4xr9q7sj535pf3wpthyhl2rs9pdqh2vrsg', //
  'npub10m75ad8pc6wtlt67f6wjeug4hpqurc68842ve5ne47u9lkjqa0lq8ja88s', // 313Chris:hellokitty_headbang:
  'npub10y6rhnutt52wwt5f7544tq4as6jt03aq7j8mle7wcymjjudanm4q4hvzaw', // NSFW
  'npub12a3my5mywqnlule3a7f6uuq76435j7j00h0tvy0phpet8xg2j3nq3nlntw', // Get SCORE Cash RSS Feed (RSS Feed)
  'npub13806pd9p833wkgyemeqddjzdksunlq9gszq4yjnhw4l57sjjhwlq6m79nj', // Orvalho
  'npub13m4q96y3yzzev25npv5tamfxsw5csc2dax3njag2uzesv83vdkcs9973fv', // 🔞鸟巢🔞
  'npub13n6ednsew67xk7hgse670z7849q5h8su5rgydxtl4lq3r5cx4ecqsd9af4', // Everybody, Every Body
  'npub13teffx3nkty8c85dg06ewwue3hqm0kg7lxv6hkv0mp2jtkfypyas4luudc', // S
  'npub14agvvpaqjc922sn7vrkg769xujxh2wp2xdcd7xgrzec4ykyam6yshjepay',
  'npub15asxgmzhextsxd8545rldcqgauq3ycxjta6a9m4x70p927jvltpq983udd', // Big Wanker
  'npub15xnjasjznk2tqude45pd7epjztgl9a550kn3pvztuarv9agfecrq7sv2ww', // Steel Seraphim
  'npub16932qv3sz53t9fdlm2n7scct5ahe9fy9vsct36qd0wcwxm94gyks47dcg6', // Preggers
  'npub16ye5pezunzcx8y0ecjquks0sr5jkj6lrhfjyu2n9qxt5cxgzrvcqgnvx8s', // Aru Moon
  'npub17693mv2qu7mv67zqpcup9n502gmkuhytkxq3sw7qp50vlptq8f7syzv93d', // sha0wgoone
  'npub177wu03dgx6zt9a9hdey079prfw5lvj5dhm20z4k96tf6um6zjk7qyzdumj', // Eoun
  'npub17fvwg0z0dw54ghjqucep3nz0frj46fy0z35nvcynmpgm6yeam6fsny7n02',
  'npub183tgfk2u2zt7tzqwfsvd6wa3d6d9z474v3874wvuv0y3l8z54faskufdh4', // Goon Master
  'npub18c2udd3zxf3zw4l582cxzfvptcxg44k358dy8uam683775dsmpeq7zlay2', // Sexflix
  'npub1935j9y7lzyu8mx0zm8mcr4njzrsautl66ms0w3z7wyea04zh85psqdc3v6',
  'npub19e2tewftsy7ysd6hhkc4wn2czd4ku34z7wqkw5y4q8lm8fzhgxjsfhw825', // Waifposter88
  'npub19sjqp4cvlv2quj0rls8lfs9sy2yquclq60xhatjrjhdu55qh7jtq9v8wy4', // 中本聰
  'npub19v2wlfdsrvcdhjlvk2ur2wgyc30ult76flhyzaatew5n432a6ahs6ptsgt', // 纪唯一
  'npub19xwjw7f23nsmnsd0j72mvhrdswt4cp6urc5el2zuu8se3yfu87ess524je', // Gone Wild (NSFW)
  'npub1acwrv7aqgu949mw0zxmw2akgsjqp574nnq4vcl9wln5355q79w5ssv9qxg', // Arianna
  'npub1acwrv7aqgu949mw0zxmw2akgsjqp574nnq4vcl9wln5355q79w5ssv9qxg', // Arianna
  'npub1af9lxfzeq5rxmu9zz7d85tn2ex8zvvlx0duqcemcdhkz9cvlt29st3rcgd', // Happy Nut
  'npub1apr6dy5z4f0qs4cnswxj0gf37g46jxvh7xgwgs4wvzm6stu8f0asd4996r', // Anime Girl
  'npub1ccs7rlmctzzv6sj5qcjd3fdlys8zr3q6mnj30l4r4n6xp999yx7qg5qwtg', // gynoiddolls
  'npub1csk2wg33ee9kutyps4nmevyv3putfegj7yd0emsp44ph32wvmamqs7uyan', // Lilura
  'npub1d5ygkef6r0l7w29ek9l9c7hulsvdshms2qh74jp5qpfyad4g6h5s4ap6lz', // 莫谈国事
  'npub1dn42tzy8v8m2xu4y38djf28dfugf5vkg2uucueeldvmucdlcwgjsk49856', // Mila
  'npub1dr79j9x35m54fpyha6dtg0c93ax57shuf4e442ls8lps3ykyjsyszvs2l3',
  'npub1e4n8nah09he25slv00dz3kav3jsu5jvp83aya234ejumcmu2xseqwrp6pl', // Svenno(NSFW)
  'npub1f3n7hq0a6vyfsjrv9vfdwtasa0g98ve96he68rxsvq9x6cl8tvxqmv6ca4', // Lady Sex (nude anime)
  'npub1femd0mrawr0jmtjr2jwa2nm90haxrpglzdt6tt0djrsav39e53asf74aer', // FemDom Raw
  'npub1fevdattp2nd69c47cvldjp73hd3rjqynt9j7azgsjrdlt6jmhx9qagw3la', // Nova
  'npub1fh8e9pnm8rfln0k7c6uh8wrvmva8enkdzsgzsc7v9jk97up23ewqs6kuue', // nostrporn
  'npub1fr8lj8ny89jm93lk977494le5u2qmhuxg55n7lmtm0e50khzdxxq5almwg', // terry
  'npub1fut75jn7hztc248vz3g8vfsdtwuy95l6khw533k6dsstsdrxkussf9ax6g', // bliss (not many nude art posts)
  'npub1ga79p6qsjh0xd343q3du2unf2gl6gk0rde36c06mafxkrssmnnesxyzcss', // Orange Incest 🔞
  'npub1grssdyrmdgy5gw5umg50u6rrl9nk738lw4qg2thpcqqaf3lypkqsxt7lhg', // Shades of Red
  'npub1hjdtj67ckrq0lzga2mchny3wmgn6rptp826djd6edgyru7x6dszq093c0a', // ai
  'npub1hpxzg0p4hrmfvqmrusa4lkyx0ay53k2gwkjr50qe2cedj3vkufhs030ff0', // Spankingbot
  'npub1j0xvl8l2s4w25vcavf3jv6fgyakyc0hplxc9we8hc8mja0ct7epss0qlkj', // Thicc Pics (NSFW)
  'npub1j0y6f9gl9w39ggarr9x76lyh2swv7mpgddguv49mhmzqlz8tm69qcwpl55', // NeoMobius
  'npub1j2u3lfkhl95e6qwswr32hx6h36arlw8p2cl6hy0wgnmxmekrhx8qx93uvh', // Ay Papi
  'npub1j70jp36nshq4zknnwgeamux8hdgzhf0yw50rpll0egw6cvnglalsuldjwe', // cy₿erleolao
  'npub1jge7z2kpmpdra6g58vg95uznve8ctcenmlyp9ntr3kjymscyuqpqty2cdh', // Storm
  'npub1jhx97uhuagcux3zqc6yfvrvlkv0jfrtlywrp7du08gl9dw3439rsj3zcka',
  'npub1jjtzhxzu8dlf7yn480sz67tesnfl7gpzfpkgpez05d2z9y3lya5sxvky0y', // Selfie Girls
  'npub1jp9v034z3a26cp5hajwyuzl0hety5akdpwdnjaqgfd7pm2ts4dwsc29va8', // curatedbliss
  'npub1jvp6kfs2d3m98lyw5wcyr4fnctr83s0rc3mj5p0f75ach6vcd8rst6wqnu', // VelectBlue Art
  'npub1kade5vf37snr4hv5hgstav6j5ygry6z09kkq0flp47p8cmeuz5zs7zz2an', // Aeontropy
  'npub1klxseqx4et3grzgvajtlm47tz7tqmxygwj49kx3frsuls9cf8lhqhhhr5q', // Riley_R_Fan
  'npub1kq67ngznkldmecycjfmjt4deuvyxgpn4zcpq8cvfmdl2hufzzccs6nc9q8', // Sargas
  'npub1ksfas092cnlnpem5nn4y20yqdgc80ctqvk47vrw9l5nsd84nrewqlxhfjd',
  'npub1kul999wnt8gwa6l2vyuewhnmmp25gq7dly9zmgsw52x8csmqjgts7278rx', // 𝓟𝓮𝓽𝓲𝓽𝓮 𝓟𝓻𝓲𝓷𝓬𝓮𝓼𝓼
  'npub1kvjspwal4kqnvhkraursdhe9elhdsddtuhtj22ql3dvckzlazngqh4d68q', // Girlection
  'npub1lua7422kkuksdww4x794z4pp0vwkv463g4j3s4kzurjnn9w2zcsqu3glte', // Awake
  'npub1m5fdz9gqa2qeudpy47zllmv9gqe3zzj44dkt9lh2kes3mlex7e6se348vy', // Marble Sculture
  'npub1mgusda7ujnyuhhudwkyrp763k4dd9xspktekl0tg5v0j76yph8ssyrfdpm', // anisyia
  'npub1mlvajfc90xjujssqzsq8q8vyjq7wt5unckvfutznm5tgej4lnh5qka7uvx', // Monica
  'npub1nhh58qjd0yxmmpqqjkf3mu2lzm3scv7jtjjyv3ejenk3xgxewslspew0uf', // Blone AI (nudity)
  'npub1nkw853ncf4nmsctujc3hdahwtm03hssrskc2t33qjqedxtpwupfqeukt53', // bpufa
  'npub1nllxsheh5hpy55rkmkt46lee4m8tk05g8fmp7nf0mu7hhcz3qc4s7m2vsn', // Aria Hikari
  'npub1nme4074q6yrqexdn5z625vhvv9j9e2qwwfcgdyg2utffhvdgrxfqn5ztgm', // Ay Papi
  'npub1p4j4zfxvdgjrs26wx5dh9uvsvqfv8xa7ew89vv60nxang8cn0sxshyj28r', // Porn search bot
  'npub1peq5ds2jaj5en35xgl6r6rxvvk9eh4ppzhs4mpdh9s5y8ffdwl5q7nmyda', // Furry Artworks 18+
  'npub1pl0qa9x3n8wt55em0x3zwuy02rtl5t3jsretr0egjqgkx2f6jztqt0xwew', // nude
  'npub1prxgd4slvue3fxwtgvpcawmgvl5fqal8ujan6z3uhvzy20gwcdyqlu7d2p', // Miss Addication 18+
  'npub1qg550au9hqmpgye4kfrtj7yt85dn60ty5hk0hcm7pktq6g6mzugsufnfcx', // Poppy Clements
  'npub1qnpzqvzjxy79wpuvylw65gkh8n7pk62up9nc63a45a23mv0sf6us62qk5n', // 🔞▶️Play & ⏸️Pause 🔞
  'npub1qrgawjx8cvc0qsd5te5dep3ynmklsye55gu0w9d4y6tk0vcxduassqqgzf', // dustycity
  'npub1rqnhn57h5fpc5ugd0mwpkkjsfpgz0uf0s4340w9gp5aykze8kvdsr6kq38', //  潔💋
  'npub1rv08kght99a7xwckm0qpmzw09m5gwppequgqd8lwu74eakgaavwsp5cjtw', // CuratedNSFW
  'npub1sg7rwnf96a0fhl85xlvq0unumqqh89qaygwcdy5d3ue8209ekt2suhxg7u', // Anime Mommies Bot
  'npub1sgmuwdfzq2asrh68p6ul9chp32y4938qa7ns637qgmeqgglhtwmq4l5xl9', // Nudeful Art / Athos
  'npub1skvfwq29xn92k08mu2584kx5x6ymz62askpnzjp9d3s8us68pemsmt78a4', // pornstarxyz
  'npub1suddec4n2jv50pgn9eea35r4k83ahr4mcj0zv2uec36w6jeuwagq82xjgl', // quiet.enjoyer
  'npub1t07mr7m65lg3ecr5eapu6qe4ayt2wgjpqjs8x58m5kx2r2cutsyqyzzzs9', // NOT NSFW but spammy ai pictures
  'npub1t252vm7u5qmfwv3k70g6rl2ue7ctvtvrnd60vy8jh5suglv8pw2snyyzfq', // 20th Century Foxes (NSFW)
  'npub1thsprukxnc8rxqggnesqp2wg2temhaadzhhg7n4pttpveyqedlwsqgge9q', // Harmony. Corrupted.
  'npub1tsrs6ptjnq5hluxawfme5sfxalfscapequm3ej0yfw65scwu8lys8q7y7l', // 💜 🔞EUPHORIA 🔞💜
  'npub1ulafm4d3n7ukl7yzg4hfnhfjut74nym5p83e3d67l3j62yc6ysqqrancw2', // naked
  'npub1v3rnmlms82wgxejxwn7rr6kjruy3ty0l4084dx2zp3tn8dlxv28sjnp6pf', // High Elf Archer
  'npub1ve4ztpqvlgu3v6hgrvc4lrdl2ernue7lq2h8tcgaksrkxlm7gnsqkjmz4e', // bluntkaraoke
  'npub1vmd8l5h60wqzp5yyjdutleyntqlq86yqxhwxwayek488rngtaras2z99sh', // ANDREIITA
  'npub1vqj24qfy8c5n23m28jj89v6lcrfwx3l0c4vsk6h590c38t79fccsqx3q8g', // Get SCORE Cash RSS Feed (RSS Feed)
  'npub1vyxmz6xgf84f8x73ww7vts6apag3ngs957eterw5lgay2z7f55tskahsja', // Homer
  'npub1wmsn8fch7kwt987jcdx06uuapn6pwzau59pvy0ql5d3xlmnxa2csj3c5p4', // StefsPicks
  'npub1y77j6jm5hw34xl5m85aumltv88arh2s7q383allkpfe4muarzc5qzfgru0', // sexy-models
  'npub1ydss4m4s93zvzmjhv4dp69vj48wc6t8ufx8rzttv2vq330yr9geq73mv2m',
  'npub1yk6fz5gx6m79g3xvxk3ca9u87mh8t73w2u2tzvdmrqwauvsqtsnsq6rcqm', // bloodywing
  'npub1ylq5s3xsdmzgzvgzll6ghcs3qa8a9ajl955hj4tcpmyruvjsl8nq5wqhd8', // Dnera
  'npub1ylrnf0xfp9wsmqthxlqjqyqj9yy27pnchjwjq93v3mq66ts7ftjs6x7dcq', // Welcome To The Jungle
  'npub1z0xv9t5w6evrcg860kmgqq5tfj55mz84ta40uszjnfp9uhw2clkq63yrak', // ???
  'npub1zfm8u0rkgng5uflv9a0nl2gr76cuj7mzsltrur6z9zc8jcykyefskxrvhz', // mikee
  'npub1q3znd3tumjlpwn8z8uq4f9tvjh2xryc6z5d8vy2kku69a7xgperqfv38ez',
  'npub1rwh4musdpv9xryua2tucsgfmqhua70ct36gxqrr84ddty30un7xsmpmjcy',
  'npub18puyr2ltlzfqutj3pl6dm50zu7p5ar2t38wdcj9qhsplfl04easqudrc67',
  'npub1zzgzsp0czctjwe6cmnsn0vyjtskyajghsl9rc22y5uqc0ym5qcrqrrwr02',
  'npub1cgchvzcsemalc0tm4e0z6k6quthpw98ljr9h3l8lgzagyy3d62lq5sf0qk',
  'npub1rxsxj8egpr3emylfdld0wgh63w048tjh5zaua84h2qjscswn68ysdlt68s',
  'npub13lpdphw06d5hy5h7n0xsun9sfpwqsna9gsg0y0d4ukktks048nrseedtx9',
  'npub1lrxxjtq7zyp2d4n44tllwqj4q20kk7dslh2xrq0qkwng5lldxqesmvvgyt',
];

export const adultPublicKeys = adultNPubs.map(npub => (nip19.decode(npub).data as string).toLowerCase());

export const mixedAdultPublicKeys = mixedAdultNPubs.map(npub => (nip19.decode(npub).data as string).toLowerCase());

/* The following profiles have questionable content and are blocked completely on slidestr.net */
export const blockedNPubs = [
  'npub10m6d9ynzzx0w07spu2n5cx36z77smmyn7rs9gsvta57etrcyh68swace67',
  'npub10xrnm6sy804cakmeew4g7kd4fl3dfvvsqfk6m3v4c6j4smrh9mlsdwpz7a', // CISAM
  'npub125wcpwdn0zmt3accu3jlkv349jgw9d8htk4cjx2spc9qfvusl7hs6np5pt',
  'npub15rt2a6cuapmzc595k0hrup4zjehy8tprshdrlvqkjzxteq47lmlspq5zwu',
  'npub16dx8unvqnweeauxsaw479qhy2j5z8s2krvzaq4rsull57e9klldspdqvpm', // Pascub
  'npub1awxh85c5wasj60d42uvmzuza2uvjazff9m7skg2vf7x2f8gykwkqykxktf', // AIイラスト',
  'npub1curnt7jtq8mhl9fcswnwvuvc9ccm6lvsdv4kzydx75v92kldrvdqh7sq09', // Love AI
  'npub1dka3gtykxm8rfhysdm5mfxejfdee5natdemzqh44vhje2l4tyslq3sv0fm',
  'npub1dnrxwmpe7c3zh28th6quca308a5x0587anc93wjnmt0p50x8jtysc8v6wx',
  'npub1exd5jsen3gmup2uu5j464jv9lr3z57etkhm6xw0dqnct6tzntvss4jxjhf',
  'npub1f3fzedmk3x8nmq0vkefnt3esrgg3vmynh096uj62wganf442p6wqg4hxft',
  'npub1hgxsvwfmmzmhkew0hada7yknl6wvlkfm5cj47g85hlxvfxvd0l8sj960ex',
  'npub1kf8sau5dejmcmfmzzj256rv728p5w7s0wytdyz8ypa0ne0y6k0vswhgu9w', // noname
  'npub1l3uyqsaq029zrdjnnl73lzaew39dspherxmkngr9hrt2spv782tsjqe50x',
  'npub1nshq4pcyzdmnewg4h8yu6tsuh5t72whzkz5x4wj7t0c0cy7yyrfqq2cgnl',
  'npub1r6tch2hyznhwnyxm4xfgw92f449qnxuadal8rjq9nvj5agpymhwqmghzty',
  'npub1sd8lf7fxt7psc0f8u9mf945nah78tzdp4kx4z5jfgz3sntm3pcls80vx3c',
  'npub1srs9l2pex6fmex52ka7ypk8ms2gk47aphgtqrl6yu5ly8hzgg2qqusgkdt',
  'npub1ss2z5jpj2sd8cl3dxps7av9kmgtm5epej2yj2vxkx8ckw0gzxwws7l5wea',
  'npub1xfu7047thly6aghl79z97kckkvwfvtcx88n6wq7c2tlng484d8xqv0kuvv', // Erandis Vol
  'npub1r668uwlt7vslu306q0saxt656zl45j8n2ztacal40r90dfl3lv3s6eq8wn',
  'npub1cw626vmllzzeej5k8zehpnhjevc8stqctstdswmlnqa85xx0gf0scr4qfu',
  'npub1krldgpd3tkz4565s69evjk7gee9arkgyz3ts0aekrhc7ru37am8qx43ncv',
  'npub1tt3n7nm548jf4jsgy9vwt25khz2n47d8um0lam0nmpk034zzlp2sfpc7tq',
  'npub1yrqtnr4qxvjqj4zs45sw3xlrflzks86dhy0y4hzj9jweujflksfszhsp06',
  'npub13mnfsm49p8hka246khma4gdzd9w8ygyt3udrcxmgmmhd5cyt5y3q879pvy',
];

export const blockedPublicKeys = blockedNPubs.map(npub => (nip19.decode(npub).data as string).toLowerCase());

export const spamAccounts = [];

export const defaultRelays = [
  // 'ws://localhost:4869',
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://nos.lol',
  'wss://nostr.wine',
  'wss://relay.primal.net',
  'wss://relay.mostr.pub',
  'wss://purplepag.es/', // needed for user profiles
];
