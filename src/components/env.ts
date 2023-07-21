import { nip19 } from "nostr-tools";

export const appName = "slidestr.net";

export const defaultHashTags = [
  "art",
  "artstr",
  "catstr",
  "dogstr",
  "nature",
  "naturephotography",
  "photography",
  "photostr",
  "streetphotography",
];

export const nfswTags = [
  "ass",
  "blowjob",
  "boobstr",
  "buttstr",
  "erostr",
  "erotic",
  "freethenipple",
  "friskyfriday",
  "naked",
  "nakedart",
  "nasstr",
  "nsfw",
  "nude",
  "nudeart",
  "pornhub",
  "pornstr",
  "pussy",
  "suicidegirls",
  "tits",
  "titstr",
];

export const nsfwPubKeys = [
  "npub13806pd9p833wkgyemeqddjzdksunlq9gszq4yjnhw4l57sjjhwlq6m79nj", // Orvalho
  "npub13n6ednsew67xk7hgse670z7849q5h8su5rgydxtl4lq3r5cx4ecqsd9af4", // Everybody, Every Body
  "npub19xwjw7f23nsmnsd0j72mvhrdswt4cp6urc5el2zuu8se3yfu87ess524je", // Gone Wild (NSFW)
  "npub1af9lxfzeq5rxmu9zz7d85tn2ex8zvvlx0duqcemcdhkz9cvlt29st3rcgd", // Happy Nut
  "npub1e4n8nah09he25slv00dz3kav3jsu5jvp83aya234ejumcmu2xseqwrp6pl", // Svenno(NSFW)
  "npub1femd0mrawr0jmtjr2jwa2nm90haxrpglzdt6tt0djrsav39e53asf74aer", // FemDom Raw
  "npub1ga79p6qsjh0xd343q3du2unf2gl6gk0rde36c06mafxkrssmnnesxyzcss", // Orange Incest 🔞
  "npub1j0xvl8l2s4w25vcavf3jv6fgyakyc0hplxc9we8hc8mja0ct7epss0qlkj", // Thicc Pics (NSFW)
  "npub1j0y6f9gl9w39ggarr9x76lyh2swv7mpgddguv49mhmzqlz8tm69qcwpl55", // NeoMobius
  "npub1jge7z2kpmpdra6g58vg95uznve8ctcenmlyp9ntr3kjymscyuqpqty2cdh", // Storm
  "npub1jjtzhxzu8dlf7yn480sz67tesnfl7gpzfpkgpez05d2z9y3lya5sxvky0y", // Selfie Girls
  "npub1jp9v034z3a26cp5hajwyuzl0hety5akdpwdnjaqgfd7pm2ts4dwsc29va8", // curatedbliss
  "npub1kul999wnt8gwa6l2vyuewhnmmp25gq7dly9zmgsw52x8csmqjgts7278rx", // 𝓟𝓮𝓽𝓲𝓽𝓮 𝓟𝓻𝓲𝓷𝓬𝓮𝓼𝓼
  "npub1m5fdz9gqa2qeudpy47zllmv9gqe3zzj44dkt9lh2kes3mlex7e6se348vy", // Marble Sculture
  "npub1mgusda7ujnyuhhudwkyrp763k4dd9xspktekl0tg5v0j76yph8ssyrfdpm", // anisyia
  "npub1pl0qa9x3n8wt55em0x3zwuy02rtl5t3jsretr0egjqgkx2f6jztqt0xwew", // nude
  "npub1rv08kght99a7xwckm0qpmzw09m5gwppequgqd8lwu74eakgaavwsp5cjtw", // CuratedNSFW
  "npub1suddec4n2jv50pgn9eea35r4k83ahr4mcj0zv2uec36w6jeuwagq82xjgl", // quiet.enjoyer
  "npub1t252vm7u5qmfwv3k70g6rl2ue7ctvtvrnd60vy8jh5suglv8pw2snyyzfq", // 20th Century Foxes (NSFW)
  "npub1thsprukxnc8rxqggnesqp2wg2temhaadzhhg7n4pttpveyqedlwsqgge9q", // Harmony. Corrupted.
  "npub1ulafm4d3n7ukl7yzg4hfnhfjut74nym5p83e3d67l3j62yc6ysqqrancw2", // naked
  "npub1ve4ztpqvlgu3v6hgrvc4lrdl2ernue7lq2h8tcgaksrkxlm7gnsqkjmz4e", // bluntkaraoke
  "npub1xfu7047thly6aghl79z97kckkvwfvtcx88n6wq7c2tlng484d8xqv0kuvv", // Erandis Vol
  "npub1y77j6jm5hw34xl5m85aumltv88arh2s7q383allkpfe4muarzc5qzfgru0", // sexy-models
  "npub1ylrnf0xfp9wsmqthxlqjqyqj9yy27pnchjwjq93v3mq66ts7ftjs6x7dcq", // Welcome To The Jungle

].map((npub) => (nip19.decode(npub).data as string).toLowerCase());

export const spamAccounts = [];
