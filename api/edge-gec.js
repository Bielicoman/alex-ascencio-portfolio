// Sec-MS-GEC v2, adapted from edge-tts (rany2), LGPL-3.0-or-later.
// Modifications: JavaScript port for the portfolio's existing Node TTS endpoint, 2026-10-26.
// https://github.com/rany2/edge-tts/blob/master/src/edge_tts/drm.py
/*
The MIT license is used for 'src/edge_tts/srt_composer.py' only. All
remaining files are licensed under the LGPLv3.

-----------------------------------------------------------------------

The MIT License

Copyright (c) 2014-2023 Christopher Down
Copyright (c) 2025- rany <rany@riseup.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

-----------------------------------------------------------------------

                   GNU LESSER GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.


  This version of the GNU Lesser General Public License incorporates
the terms and conditions of version 3 of the GNU General Public
License, supplemented by the additional permissions listed below.

  0. Additional Definitions.

  As used herein, "this License" refers to version 3 of the GNU Lesser
General Public License, and the "GNU GPL" refers to version 3 of the GNU
General Public License.

  "The Library" refers to a covered work governed by this License,
other than an Application or a Combined Work as defined below.

  An "Application" is any work that makes use of an interface provided
by the Library, but which is not otherwise based on the Library.
Defining a subclass of a class defined by the Library is deemed a mode
of using an interface provided by the Library.

  A "Combined Work" is a work produced by combining or linking an
Application with the Library.  The particular version of the Library
with which the Combined Work was made is also called the "Linked
Version".

  The "Minimal Corresponding Source" for a Combined Work means the
Corresponding Source for the Combined Work, excluding any source code
for portions of the Combined Work that, considered in isolation, are
based on the Application, and not on the Linked Version.

  The "Corresponding Application Code" for a Combined Work means the
object code and/or source code for the Application, including any data
and utility programs needed for reproducing the Combined Work from the
Application, but excluding the System Libraries of the Combined Work.

  1. Exception to Section 3 of the GNU GPL.

  You may convey a covered work under sections 3 and 4 of this License
without being bound by section 3 of the GNU GPL.

  2. Conveying Modified Versions.

  If you modify a copy of the Library, and, in your modifications, a
facility refers to a function or data to be supplied by an Application
that uses the facility (other than as an argument passed when the
facility is invoked), then you may convey a copy of the modified
version:

   a) under this License, provided that you make a good faith effort to
   ensure that, in the event an Application does not supply the
   function or data, the facility still operates, and performs
   whatever part of its purpose remains meaningful, or

   b) under the GNU GPL, with none of the additional permissions of
   this License applicable to that copy.

  3. Object Code Incorporating Material from Library Header Files.

  The object code form of an Application may incorporate material from
a header file that is part of the Library.  You may convey such object
code under terms of your choice, provided that, if the incorporated
material is not limited to numerical parameters, data structure
layouts and accessors, or small macros, inline functions and templates
(ten or fewer lines in length), you do both of the following:

   a) Give prominent notice with each copy of the object code that the
   Library is used in it and that the Library and its use are
   covered by this License.

   b) Accompany the object code with a copy of the GNU GPL and this license
   document.

  4. Combined Works.

  You may convey a Combined Work under terms of your choice that,
taken together, effectively do not restrict modification of the
portions of the Library contained in the Combined Work and reverse
engineering for debugging such modifications, if you also do each of
the following:

   a) Give prominent notice with each copy of the Combined Work that
   the Library is used in it and that the Library and its use are
   covered by this License.

   b) Accompany the Combined Work with a copy of the GNU GPL and this license
   document.

   c) For a Combined Work that displays copyright notices during
   execution, include the copyright notice for the Library among
   these notices, as well as a reference directing the user to the
   copies of the GNU GPL and this license document.

   d) Do one of the following:

       0) Convey the Minimal Corresponding Source under the terms of this
       License, and the Corresponding Application Code in a form
       suitable for, and under terms that permit, the user to
       recombine or relink the Application with a modified version of
       the Linked Version to produce a modified Combined Work, in the
       manner specified by section 6 of the GNU GPL for conveying
       Corresponding Source.

       1) Use a suitable shared library mechanism for linking with the
       Library.  A suitable mechanism is one that (a) uses at run time
       a copy of the Library already present on the user's computer
       system, and (b) will operate properly with a modified version
       of the Library that is interface-compatible with the Linked
       Version.

   e) Provide Installation Information, but only if you would otherwise
   be required to provide such information under section 6 of the
   GNU GPL, and only to the extent that such information is
   necessary to install and execute a modified version of the
   Combined Work produced by recombining or relinking the
   Application with a modified version of the Linked Version. (If
   you use option 4d0, the Installation Information must accompany
   the Minimal Corresponding Source and Corresponding Application
   Code. If you use option 4d1, you must provide the Installation
   Information in the manner specified by section 6 of the GNU GPL
   for conveying Corresponding Source.)

  5. Combined Libraries.

  You may place library facilities that are a work based on the
Library side by side in a single library together with other library
facilities that are not Applications and are not covered by this
License, and convey such a combined library under terms of your
choice, if you do both of the following:

   a) Accompany the combined library with a copy of the same work based
   on the Library, uncombined with any other library facilities,
   conveyed under the terms of this License.

   b) Give prominent notice with the combined library that part of it
   is a work based on the Library, and explaining where to find the
   accompanying uncombined form of the same work.

  6. Revised Versions of the GNU Lesser General Public License.

  The Free Software Foundation may publish revised and/or new versions
of the GNU Lesser General Public License from time to time. Such new
versions will be similar in spirit to the present version, but may
differ in detail to address new problems or concerns.

  Each version is given a distinguishing version number. If the
Library as you received it specifies that a certain numbered version
of the GNU Lesser General Public License "or any later version"
applies to it, you have the option of following the terms and
conditions either of that published version or of any later version
published by the Free Software Foundation. If the Library as you
received it does not specify a version number of the GNU Lesser
General Public License, you may choose any version of the GNU Lesser
General Public License ever published by the Free Software Foundation.

  If the Library as you received it specifies that a proxy can decide
whether future versions of the GNU Lesser General Public License shall
apply, that proxy's public statement of acceptance of any version is
permanent authorization for you to choose that version for the
Library.

*/
const SHA256_INITIAL = [1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];
const SHA256_STATE = [4255104674,2435071207,3192492180,3442351626,1811967817,79508907,4272990180,66059218];
const SHA256_SCHEDULE = [3945054110,358115615,2696978146,217723578,2787307148,3520959633,3235718560,4192668342,4039316851,1884868174,1904797190,15051571,3529027680,1920361828];
const SHA256_ROUND_CONSTANTS = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
const CS64_COEFFICIENTS = [3895366065,3005677776,1155409094,2296378653,1005282748,693190712,3365689651,3005795295,2367603217,3557143765,827258325,652566332,3911487921,1618477510,4037392853,2192753147,101076211,4199654362,3665427040,545047652,3201434976,1010595059,2314848760,3536931681,905590982,3137643201,3410617286,3311559015];

const rotate = (v, n) => (v >>> n) | (v << (32 - n));
const sigma0 = v => rotate(v, 7) ^ rotate(v, 18) ^ (v >>> 3);
const sigma1 = v => rotate(v, 17) ^ rotate(v, 19) ^ (v >>> 10);
const rol16 = v => ((v << 16) | (v >>> 16)) >>> 0;
const mul = (a, b) => Math.imul(a, b) >>> 0;
function expand(words, from = 16) {
  for (let i = from; i < 64; i++) words[i] = (sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]) >>> 0;
}
function rounds(state, words, from = 0) {
  let [a,b,c,d,e,f,g,h] = state;
  for (let i = from; i < 64; i++) {
    const constant = from === 14 && i === 14 ? 0xC9DC06A7 : SHA256_ROUND_CONSTANTS[i];
    const t1 = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + (g ^ (e & (f ^ g))) + constant + words[i]) >>> 0;
    const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) | (c & (a | b)))) >>> 0;
    [a,b,c,d,e,f,g,h] = [(t1+t2)>>>0,a,b,c,(d+t1)>>>0,e,f,g];
  }
  return [a,b,c,d,e,f,g,h];
}
function digest(data) {
  const words = Array(14).fill(0);
  words.push(data.readUIntBE(0, 3), data.readUInt32BE(3));
  for (let i = 16; i < 30; i++) {
    let v = SHA256_SCHEDULE[i - 16];
    if (i - 2 >= 14) v += (sigma1(words[i - 2]) ^ (i === 16 ? 0x000B92C0 : 0)) >>> 0;
    if (i - 7 >= 14) v += words[i - 7];
    if (i - 15 >= 14) v += (sigma0(words[i - 15]) ^ (i === 29 ? 0x059C0B80 : 0)) >>> 0;
    words.push(v >>> 0);
  }
  words.push((sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + 0xC9DC06A7 - SHA256_ROUND_CONSTANTS[14]) >>> 0);
  expand(words, 31);
  let state = rounds(SHA256_STATE, words, 14).map((v,i)=>(v+SHA256_INITIAL[i])>>>0);
  const length = 57 + data.length;
  const padded = Buffer.concat([data.subarray(7), Buffer.from([0x80]), Buffer.alloc(((55-length)%64+64)%64), Buffer.alloc(8)]);
  padded.writeBigUInt64BE(BigInt(length*8), padded.length-8);
  for (let offset=0;offset<padded.length;offset+=64) {
    const w=Array.from({length:16},(_,i)=>padded.readUInt32BE(offset+i*4));
    expand(w);state=rounds(state,w).map((v,i)=>(v+state[i])>>>0);
  }
  const out=Buffer.alloc(32);state.forEach((v,i)=>out.writeUInt32BE(v,i*4));return out;
}
function cs64(data, hash) {
  const keys=[(hash.readUInt32LE(0)|1)>>>0,(hash.readUInt32LE(4)|1)>>>0];
  const factors=keys.map(k=>mul(k,0x82893933));
  const terms=[], offsets=[];
  for(let i=0;i<CS64_COEFFICIENTS.length;i+=2){terms.push(mul(CS64_COEFFICIENTS[i],factors[(i/2)%2]));offsets.push(CS64_COEFFICIENTS[i+1]);}
  const bytes=Buffer.concat([Buffer.from([0]),data]);
  const padded=Buffer.alloc(Math.ceil(bytes.length/8)*8);bytes.copy(padded);
  for(let i=0;i<padded.length/4;i++){
    const word=padded.readUInt32LE(i*4);
    let term=mul(word,keys[i%2]),offset=mul(rol16(word),i%2?0xC31713DB:0xEF0569FB);
    if(!i){term=(term+mul(0xF2F90B1A,factors[0]))>>>0;offset=(offset+0x0B1A0000)>>>0;}
    terms.push(term);offsets.push(offset);
  }
  let swapAcc=0,swapLast=0,state=0,acc=0;
  for(let i=0;i<terms.length;i+=2){
    const x=terms[i],y=terms[i+1];
    let q=mul(rol16((offsets[i]+x)>>>0),0x76F50F34);
    swapAcc=(swapAcc+((mul(rol16(q),0xC3EFEA97)+q)>>>0))>>>0;
    q=mul(rol16((offsets[i+1]+y)>>>0),0x1881CE3C);
    swapLast=(mul(rol16(q),0x35BD1EC9)+q)>>>0;swapAcc=(swapAcc+swapLast)>>>0;
    state=(mul(state,keys[0])+x)>>>0;
    for(const k of [0xCF98B111,0x87085B9F,0x12CEB96D,0x257E1D83])state=mul(rol16(state),k);
    acc=(acc+state)>>>0;
    let t=(mul(state,keys[1])+y)>>>0;
    for(const k of [0xA27416F5,0xD38396FF,0x7C932B89,0xBFA49F69])t=mul(rol16(t),k);
    state=t;acc=(acc+state)>>>0;
  }
  const out=Buffer.alloc(8);out.writeUInt32LE((swapLast^state)>>>0,0);out.writeUInt32LE((swapAcc^acc)>>>0,4);return out;
}
let cachedTime, cachedToken;
export function edgeGec(unixSeconds = Date.now()/1000) {
  const seconds=Math.floor((unixSeconds+11644473600)/300)*300;
  if(seconds===cachedTime)return cachedToken;
  const data=Buffer.from(`${BigInt(seconds)*10000000n}6A5AA1D4EAFF4E9FB37E23D68491D6F4`);
  const hash=digest(data);
  cachedTime=seconds;cachedToken=`${cs64(data,hash).toString('hex')}-${hash.toString('hex')}`.toUpperCase();
  return cachedToken;
}
