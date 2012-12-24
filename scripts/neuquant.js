(function(){var NeuQuant,__indexOf=[].indexOf||function(item){for(var i=0,l=this.length;i<l;i++){if(i in this&&this[i]===item)return i}return-1},__slice=[].slice;({root:typeof exports!=="undefined"&&exports!==null?exports:this});NeuQuant=function(){function NeuQuant(pixels,sample,netsize){var size,_i,_j,_ref,_ref1,_results,_results1;size=pixels.length>>2;this.prime1=499;this.prime2=491;this.prime3=487;this.prime4=503;this.maxprime=this.prime4;if(size<this.maxprime){throw"Image is too small"}if(_ref=!sample,__indexOf.call(function(){_results=[];for(_i=1;_i<=30;_i++){_results.push(_i)}return _results}.apply(this),_ref)>=0){throw"Sample must be 1..30"}if(_ref1=!netsize,__indexOf.call(function(){_results1=[];for(_j=4;_j<=256;_j++){_results1.push(_j)}return _results1}.apply(this),_ref1)>=0){throw"Color count must be 4..256"}this.ncycles=100;this.pixels=pixels;this.sample=sample;this.netsize=netsize;this.specials=1;this.bgcolor=this.specials-1;this.cutnetsize=this.netsize-this.specials;this.maxnetpos=this.netsize-1;this.initradius=Math.floor(this.netsize/8);this.radiusbiasshift=6;this.radiusbias=1<<this.radiusbiasshift;this.initbiasradius=this.initradius*this.radiusbias;this.radiusdec=30;this.alphabiasshift=10;this.initalpha=1<<this.alphabiasshift;this.gamma=1024;this.beta=1/1024;this.betagamma=this.beta*this.gamma;this.setupArrays()}NeuQuant.prototype.setupArrays=function(){var i,p,_i,_j,_ref,_ref1,_ref2;this.network=this.createArray(0,this.netsize,3);this.colormap=this.createArray(0,this.netsize,4);this.netindex=this.createArray(0,256);this.bias=this.createArray(0,this.netsize);this.freq=this.createArray(0,this.netsize);this.network[0][0]=0;this.network[0][1]=0;this.network[0][2]=0;this.network[1][0]=255;this.network[1][1]=255;this.network[1][2]=255;for(i=_i=0,_ref=this.specials;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){this.freq[i]=1/this.netsize;this.bias[i]=0}for(i=_j=_ref1=this.specials,_ref2=this.netsize;_ref1<=_ref2?_j<_ref2:_j>_ref2;i=_ref1<=_ref2?++_j:--_j){p=this.network[i];p[0]=255*(i-this.specials)/this.cutnetsize;p[1]=255*(i-this.specials)/this.cutnetsize;p[2]=255*(i-this.specials)/this.cutnetsize;this.freq[i]=1/this.netsize;this.bias[i]=0}return this};NeuQuant.prototype.createArray=function(){var args,arr,dimensions,i,self,value,_i,_ref;value=arguments[0],dimensions=2<=arguments.length?__slice.call(arguments,1):[];if(!(dimensions!=null)||dimensions.length===0){return value}arr=new Array(dimensions.shift());self=arguments.callee;args=[value].concat(dimensions);for(i=_i=0,_ref=arr.length;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){arr[i]=self.apply(this,args)}return arr};NeuQuant.prototype.init=function(){this.learn();this.fix();this.build();return this};NeuQuant.prototype.learn=function(){var a,alpha,alphadec,b,biasradius,delta,g,i,j,lengthcount,p,pos,r,rad,samplepixels,step;biasradius=this.initbiasradius;alphadec=30+Math.floor((this.sample-1)/3);lengthcount=this.pixels.length;samplepixels=Math.floor(lengthcount/this.sample);delta=Math.floor(samplepixels/this.ncycles);alpha=this.initalpha;rad=biasradius>>this.radiusbiasshift;if(rad<=1){rad=0}if(typeof console!=="undefined"&&console!==null){console.log("Beginning 1D learning: sample pixels = "+samplepixels+"; radius = "+rad)}step=0;pos=0;if(lengthcount%this.prime1!==0){step=this.prime1}else if(lengthcount%this.prime2!==0){step=this.prime2}else if(lengthcount%this.prime3!==0){step=this.prime3}else{step=this.prime4}i=0;while(i<samplepixels){p=this.pixels[pos];r=p>>16&255;g=p>>8&255;b=p&255;if(i===0){this.network[this.bgcolor][0]=b;this.network[this.bgcolor][1]=g;this.network[this.bgcolor][2]=r}j=this.specialFind(b,g,r);j=j<0?this.contest(b,g,r):j;if(j>=this.specials){a=alpha/this.initalpha;this.alterSingle(a,j,b,g,r);if(rad>0){this.alterNeighbors(a,rad,j,b,g,r)}}pos+=step;while(pos>=lengthcount){pos-=lengthcount}i++;if(i%delta===0){alpha-=Math.floor(alpha/alphadec);biasradius-=Math.floor(biasradius/this.radiusdec);rad=biasradius>>this.radiusbiasshift;if(rad<=1){rad=0}}}if(typeof console!=="undefined"&&console!==null){console.log("Finished 1D learning: final alpha = "+alpha/this.initalpha)}return this};NeuQuant.prototype.fix=function(){var i,j,x,_i,_j,_ref;for(i=_i=0,_ref=this.netsize;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){for(j=_j=0;_j<3;j=++_j){x=Math.floor(.5+this.network[i][j]);if(x<0){x=0}else if(x>255){x=255}this.colormap[i][j]=x}this.colormap[i][3]=i}return this};NeuQuant.prototype.build=function(){var i,j,p,previouscol,q,smallpos,smallval,startpos,_i,_j,_k,_l,_ref,_ref1,_ref2,_ref3,_ref4,_ref5,_ref6,_ref7,_ref8;previouscol=0;startpos=0;for(i=_i=0,_ref=this.netsize;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){p=this.colormap[i];q=null;smallpos=i;smallval=p[1];for(j=_j=_ref1=i+1,_ref2=this.netsize;_ref1<=_ref2?_j<_ref2:_j>_ref2;j=_ref1<=_ref2?++_j:--_j){q=this.colormap[j];if(q[1]<smallval){smallpos=j;smallval=q[1]}}q=this.colormap[smallpos];if(i!==smallpos){_ref3=[q[0],p[0]],p[0]=_ref3[0],q[0]=_ref3[1];_ref4=[q[1],p[1]],p[1]=_ref4[0],q[1]=_ref4[1];_ref5=[q[2],p[2]],p[2]=_ref5[0],q[2]=_ref5[1];_ref6=[q[3],p[3]],p[3]=_ref6[0],q[3]=_ref6[1]}if(smallval!==previouscol){this.netindex[previouscol]=startpos+i>>1;for(j=_k=_ref7=previouscol+1;_ref7<=smallval?_k<smallval:_k>smallval;j=_ref7<=smallval?++_k:--_k){this.netindex[j]=i}previouscol=smallval;startpos=i}}this.netindex[previouscol]=startpos+this.maxnetpos>>1;for(j=_l=_ref8=previouscol+1;_ref8<=256?_l<256:_l>256;j=_ref8<=256?++_l:--_l){this.netindex[j]=this.maxnetpos}return this};NeuQuant.prototype.alterSingle=function(alpha,i,b,g,r){var n;n=this.network[i];n[0]-=alpha*(n[0]-b);n[1]-=alpha*(n[1]-g);n[2]-=alpha*(n[2]-r);return this};NeuQuant.prototype.alterNeighbors=function(alpha,rad,i,b,g,r){var a,hi,j,k,lo,p,q;lo=i-rad;if(lo<this.specials-1){lo=this.specials-1}hi=i+rad;if(hi>this.netsize){hi=this.netsize}j=i+1;k=i-1;q=0;while(j<hi||k>lo){a=alpha*(rad*rad-q*q)/(rad*rad);q++;if(j<hi){p=this.network[j];p[0]-=a*(p[0]-b);p[1]-=a*(p[1]-g);p[2]-=a*(p[2]-r);j++}if(k>lo){p=this.network[k];p[0]-=a*(p[0]-b);p[1]-=a*(p[1]-g);p[2]-=a*(p[2]-r);k--}}return this};NeuQuant.prototype.specialFind=function(b,g,r){var i,n,_i,_ref;for(i=_i=0,_ref=this.specials;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){n=this.network[i];if(n[0]===b&&n[1]===g&&n[2]===r){return i}}return-1};NeuQuant.prototype.contest=function(b,g,r){var a,bestbiasd,bestbiaspos,bestd,bestpos,biasdist,dist,i,n,_i,_ref,_ref1;bestd=Number.MAX_VALUE;bestbiasd=bestd;bestpos=-1;bestbiaspos=bestpos;for(i=_i=_ref=this.specials,_ref1=this.netsize;_ref<=_ref1?_i<_ref1:_i>_ref1;i=_ref<=_ref1?++_i:--_i){n=this.network[i];dist=n[0]-b;if(dist<0){dist=-dist}a=n[1]-g;if(a<0){a=-a}dist+=a;a=n[2]-r;if(a<0){a=-a}dist+=a;if(dist<bestd){bestd=dist;bestpos=i}biasdist=dist-this.bias[i];if(biasdist<bestbiasd){bestbiasd=biasdist;bestbiaspos=i}this.freq[i]-=this.beta*this.freq[i];this.bias[i]+=this.betagamma*this.freq[i]}this.freq[bestpos]+=this.beta;this.bias[bestpos]-=this.betagamma;return bestbiaspos};NeuQuant.prototype.convertPixels=function(pixels){var l,_i,_ref;for(l=_i=0,_ref=pixels.length;0<=_ref?_i<_ref:_i>_ref;l=0<=_ref?++_i:--_i){pixels[l]=this.convertPixel(pixels[l])}return pixels};NeuQuant.prototype.convertPixel=function(pixel){var a,b,g,r;a=pixel>>24&255;r=pixel>>16&255;g=pixel>>8&255;b=pixel&255;return this.convertPixel(a,r,g,b)};NeuQuant.prototype.convertPixel=function(a,r,g,b){var bb,gg,i,rr;i=this.search(b,g,r);bb=this.colormap[i][0];gg=this.colormap[i][1];rr=this.colormap[i][2];return a<<24|rr<<16|gg<<8|bb};NeuQuant.prototype.search=function(b,g,r){var a,best,bestd,dist,i,j,p;bestd=1e3;best=-1;i=this.netindex[g];j=i-1;while(i<this.netsize||j>=0){if(i<this.netsize){p=this.colormap[i];dist=p[1]-g;if(dist>=bestd){i=this.netsize}else{if(dist<0){dist=-dist}a=p[0]-b;if(a<0){a=-a}dist+=a;if(dist<bestd){a=p[2]-r;if(a<0){a=-a}dist+=a;if(dist<bestd){bestd=dist;best=i}}i++}}if(j>=0){p=this.colormap[j];dist=g-p[1];if(dist>=bestd){j=-1}else{if(dist<0){dist=-dist}a=p[0]-b;if(a<0){a=-a}dist+=a;if(dist<bestd){a=p[2]-r;if(a<0){a=-a}dist+=a;if(dist<bestd){bestd=dist;best=j}}j--}}}return best};NeuQuant.prototype.getColorCount=function(){return this.netsize};NeuQuant.prototype.getColorMap=function(){var a,b,exportmap,g,i,r,_i,_ref;exportmap=[];for(i=_i=0,_ref=this.netsize;0<=_ref?_i<_ref:_i>_ref;i=0<=_ref?++_i:--_i){b=this.colormap[i][0];g=this.colormap[i][1];r=this.colormap[i][2];a=255;exportmap[i]=a<<24|r<<16|g<<8|b}return exportmap};return NeuQuant}();root.NeuQuant=NeuQuant}).call(this);