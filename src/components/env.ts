import { nip19 } from 'nostr-tools';

export const appName = 'slidestr.net';

export const defaultHashTags = [
  'art',
  'artstr',
  'catstr',
  'dogstr',
  'nature',
  'naturephotography',
  'photography',
  'photostr',
  'streetphotography',
  'tavelstr',
  'gardening',
  'gardenstr',
];

export const visibleHashTags = [
  'art',
  'artstr',
  'beautiful',
  'bitcoin',
  'catstr',
  'colorful',
  'cute',
  'dogstr',
  'fashion',
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
  'travelstr',
  'travel',
];


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
  'adult',
  'nude',
  'nodestr',
  'nudeart',
  'nudes',
  'onlyfans',
  'orgasm',
  'porn',
  'pornhub',
  'pornstr',
  'pussy',
  'sex',
  'suicidegirls',
  'thighstr',
  'tits',
  'titstr',
  'xxx',
];

/* These profiles are flagged as adult / NSFW and their content is not shown
   by default. Users can enable their content through the adult content flag
   in the UI or through a URL parameter. 
*/
export const adultNPubs = [
  'npub10m75ad8pc6wtlt67f6wjeug4hpqurc68842ve5ne47u9lkjqa0lq8ja88s', // 313Chris:hellokitty_headbang:
  'npub12jedfuhk2wfr7syr38t2f55652khuyz9f88r63ftm0j2vudxq9sqq7677r', // Erikha
  'npub13806pd9p833wkgyemeqddjzdksunlq9gszq4yjnhw4l57sjjhwlq6m79nj', // Orvalho
  'npub13n6ednsew67xk7hgse670z7849q5h8su5rgydxtl4lq3r5cx4ecqsd9af4', // Everybody, Every Body
  'npub16932qv3sz53t9fdlm2n7scct5ahe9fy9vsct36qd0wcwxm94gyks47dcg6', // Preggers
  'npub16ye5pezunzcx8y0ecjquks0sr5jkj6lrhfjyu2n9qxt5cxgzrvcqgnvx8s', // Aru Moon
  'npub177wu03dgx6zt9a9hdey079prfw5lvj5dhm20z4k96tf6um6zjk7qyzdumj', // Eoun
  'npub19xwjw7f23nsmnsd0j72mvhrdswt4cp6urc5el2zuu8se3yfu87ess524je', // Gone Wild (NSFW)
  'npub1af9lxfzeq5rxmu9zz7d85tn2ex8zvvlx0duqcemcdhkz9cvlt29st3rcgd', // Happy Nut
  'npub1ccs7rlmctzzv6sj5qcjd3fdlys8zr3q6mnj30l4r4n6xp999yx7qg5qwtg', // gynoiddolls
  'npub1csk2wg33ee9kutyps4nmevyv3putfegj7yd0emsp44ph32wvmamqs7uyan', // Lilura
  'npub1e4n8nah09he25slv00dz3kav3jsu5jvp83aya234ejumcmu2xseqwrp6pl', // Svenno(NSFW)
  'npub1femd0mrawr0jmtjr2jwa2nm90haxrpglzdt6tt0djrsav39e53asf74aer', // FemDom Raw
  'npub1ga79p6qsjh0xd343q3du2unf2gl6gk0rde36c06mafxkrssmnnesxyzcss', // Orange Incest 🔞
  'npub1grssdyrmdgy5gw5umg50u6rrl9nk738lw4qg2thpcqqaf3lypkqsxt7lhg', // Shades of Red
  'npub1hjdtj67ckrq0lzga2mchny3wmgn6rptp826djd6edgyru7x6dszq093c0a', // ai
  'npub1j0xvl8l2s4w25vcavf3jv6fgyakyc0hplxc9we8hc8mja0ct7epss0qlkj', // Thicc Pics (NSFW)
  'npub1j0y6f9gl9w39ggarr9x76lyh2swv7mpgddguv49mhmzqlz8tm69qcwpl55', // NeoMobius
  'npub1j2u3lfkhl95e6qwswr32hx6h36arlw8p2cl6hy0wgnmxmekrhx8qx93uvh', // Ay Papi
  'npub1j70jp36nshq4zknnwgeamux8hdgzhf0yw50rpll0egw6cvnglalsuldjwe', // cy₿erleolao
  'npub1jge7z2kpmpdra6g58vg95uznve8ctcenmlyp9ntr3kjymscyuqpqty2cdh', // Storm
  'npub1jjtzhxzu8dlf7yn480sz67tesnfl7gpzfpkgpez05d2z9y3lya5sxvky0y', // Selfie Girls
  'npub1jp9v034z3a26cp5hajwyuzl0hety5akdpwdnjaqgfd7pm2ts4dwsc29va8', // curatedbliss
  'npub1kade5vf37snr4hv5hgstav6j5ygry6z09kkq0flp47p8cmeuz5zs7zz2an', // Aeontropy
  'npub1klxseqx4et3grzgvajtlm47tz7tqmxygwj49kx3frsuls9cf8lhqhhhr5q', // Riley_R_Fan
  'npub1kul999wnt8gwa6l2vyuewhnmmp25gq7dly9zmgsw52x8csmqjgts7278rx', // 𝓟𝓮𝓽𝓲𝓽𝓮 𝓟𝓻𝓲𝓷𝓬𝓮𝓼𝓼
  'npub1m5fdz9gqa2qeudpy47zllmv9gqe3zzj44dkt9lh2kes3mlex7e6se348vy', // Marble Sculture
  'npub1mgusda7ujnyuhhudwkyrp763k4dd9xspktekl0tg5v0j76yph8ssyrfdpm', // anisyia
  'npub1nkw853ncf4nmsctujc3hdahwtm03hssrskc2t33qjqedxtpwupfqeukt53', // bpufa
  'npub1nme4074q6yrqexdn5z625vhvv9j9e2qwwfcgdyg2utffhvdgrxfqn5ztgm', // Ay Papi
  'npub1peq5ds2jaj5en35xgl6r6rxvvk9eh4ppzhs4mpdh9s5y8ffdwl5q7nmyda', // Furry Artworks 18+
  'npub1pl0qa9x3n8wt55em0x3zwuy02rtl5t3jsretr0egjqgkx2f6jztqt0xwew', // nude
  'npub1prxgd4slvue3fxwtgvpcawmgvl5fqal8ujan6z3uhvzy20gwcdyqlu7d2p', // Miss Addication 18+
  'npub1qg550au9hqmpgye4kfrtj7yt85dn60ty5hk0hcm7pktq6g6mzugsufnfcx', // Poppy Clements
  'npub1qnpzqvzjxy79wpuvylw65gkh8n7pk62up9nc63a45a23mv0sf6us62qk5n', // 🔞▶️Play & ⏸️Pause 🔞
  'npub1rv08kght99a7xwckm0qpmzw09m5gwppequgqd8lwu74eakgaavwsp5cjtw', // CuratedNSFW
  'npub1suddec4n2jv50pgn9eea35r4k83ahr4mcj0zv2uec36w6jeuwagq82xjgl', // quiet.enjoyer
  'npub1t252vm7u5qmfwv3k70g6rl2ue7ctvtvrnd60vy8jh5suglv8pw2snyyzfq', // 20th Century Foxes (NSFW)
  'npub1thsprukxnc8rxqggnesqp2wg2temhaadzhhg7n4pttpveyqedlwsqgge9q', // Harmony. Corrupted.
  'npub1ulafm4d3n7ukl7yzg4hfnhfjut74nym5p83e3d67l3j62yc6ysqqrancw2', // naked
  'npub1ve4ztpqvlgu3v6hgrvc4lrdl2ernue7lq2h8tcgaksrkxlm7gnsqkjmz4e', // bluntkaraoke
  'npub1wmsn8fch7kwt987jcdx06uuapn6pwzau59pvy0ql5d3xlmnxa2csj3c5p4', // StefsPicks
  'npub1y77j6jm5hw34xl5m85aumltv88arh2s7q383allkpfe4muarzc5qzfgru0', // sexy-models
  'npub1ylrnf0xfp9wsmqthxlqjqyqj9yy27pnchjwjq93v3mq66ts7ftjs6x7dcq', // Welcome To The Jungle
  'npub1z0xv9t5w6evrcg860kmgqq5tfj55mz84ta40uszjnfp9uhw2clkq63yrak', // ???
  'npub1hpxzg0p4hrmfvqmrusa4lkyx0ay53k2gwkjr50qe2cedj3vkufhs030ff0', // Spankingbot
  'npub1p4j4zfxvdgjrs26wx5dh9uvsvqfv8xa7ew89vv60nxang8cn0sxshyj28r', // Porn search bot
];

export const adultPublicKeys = adultNPubs.map(npub => (nip19.decode(npub).data as string).toLowerCase());

/* The following profiles have questionable content and are blocked completely on slidestr.net */
export const blockedNPubs = [
  'npub1awxh85c5wasj60d42uvmzuza2uvjazff9m7skg2vf7x2f8gykwkqykxktf', // AIイラスト',
  'npub1xfu7047thly6aghl79z97kckkvwfvtcx88n6wq7c2tlng484d8xqv0kuvv', // Erandis Vol
  'npub1kf8sau5dejmcmfmzzj256rv728p5w7s0wytdyz8ypa0ne0y6k0vswhgu9w', // noname
  'npub16dx8unvqnweeauxsaw479qhy2j5z8s2krvzaq4rsull57e9klldspdqvpm', // Pascub
];

export const blockedPublicKeys = blockedNPubs.map(npub => (nip19.decode(npub).data as string).toLowerCase());

export const spamAccounts = [];

export const defaultRelays = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://eden.nostr.land',
  'wss://relay.shitforce.one/',
  'wss://nostr.wine',
  // "wss://nostr1.current.fyi/",
  'wss://purplepag.es/', // needed for user profiles
  'wss://n-word.sharivegas.com/', // needed for mostr.pub profiles
  //"wss://feeds.nostr.band/pics",
];
