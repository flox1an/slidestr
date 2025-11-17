import { nip19 } from 'nostr-tools';

/* The following profiles have questionable content and are blocked completely on slidestr.net */
export const blockedNPubs = [
  'npub10m6d9ynzzx0w07spu2n5cx36z77smmyn7rs9gsvta57etrcyh68swace67',
  'npub10xrnm6sy804cakmeew4g7kd4fl3dfvvsqfk6m3v4c6j4smrh9mlsdwpz7a', // CISAM
  'npub125wcpwdn0zmt3accu3jlkv349jgw9d8htk4cjx2spc9qfvusl7hs6np5pt',
  'npub15rt2a6cuapmzc595k0hrup4zjehy8tprshdrlvqkjzxteq47lmlspq5zwu',
  'npub16dx8unvqnweeauxsaw479qhy2j5z8s2krvzaq4rsull57e9klldspdqvpm', // Pascub
  'npub1awxh85c5wasj60d42uvmzuza2uvjazff9m7skg2vf7x2f8gykwkqykxktf', // AIイラスト
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

export const spamAccounts: string[] = [];
