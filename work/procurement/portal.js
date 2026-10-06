/* Purchase-portal demo: sample data only, nothing is saved or sent. */
(function(){
  "use strict";

  // Routing table: department to approver. In the real system this is a table anyone in Finance can edit.
  var ROUTES = {
    "Operations":"Head of Operations",
    "Sales":"Head of Sales",
    "Marketing":"Head of Marketing",
    "Design":"Head of Design",
    "Tech Field Support":"Head of Field Support",
    "Supply Chain":"Head of Supply Chain",
    "Documentation":"Head of Documentation",
    "HR":"Head of HR",
    "Finance":"Finance Controller",
    "Events":"Head of Events"
  };
  var ENTITIES = {
    "US company":"USD",
    "Canadian company":"CAD",
    "Israeli company":"ILS"
  };
  var VAGUE = ["needed for work","need for work","for work","needed","need it","work","na","n/a","test","asap"];

  var state, seq;

  function seed(){
    seq = 107;
    state = { reqs:[], mail:[] };
    var s = [
      {po:"PO101",name:"Sam R.",dept:"Tech Field Support",entity:"US company",type:"Specific",vendor:"Online marketplace",items:[{d:"Coil cleaner, four pack",q:2,p:38.5}],fees:0,purpose:"Cleaning coils on units in for repair at the tech hub. Current stock runs out this week.",address:"Tech hub, receiving dock",link:"https://example.com/coilcleaner",lock:"No",subs:"No",terms:"Company card",status:"ordered",
        hist:[["Submitted","",""],["Head of Field Support","Approved",""],["Finance","Approved",""],["Buyer","Ordered",""]]},
      {po:"PO102",name:"Priya K.",dept:"Operations",entity:"Canadian company",type:"Standard",vendor:"Online marketplace",items:[{d:"24 inch monitor",q:5,p:189},{d:"USB headset",q:5,p:42}],fees:0,purpose:"Desk setups for five new team members starting next month.",address:"West coast office, rear entrance, weekdays only",link:"",lock:"Maybe",subs:"No",terms:"Company card",status:"ready",
        hist:[["Submitted","",""],["Head of Operations","Approved",""],["Finance","Approved",""]]},
      {po:"PO103",name:"Dana L.",dept:"Design",entity:"Israeli company",type:"Specific",vendor:"Rendering software vendor",items:[{d:"Rendering software, annual licence",q:1,p:1650}],fees:0,purpose:"Licence for the product rendering work the design team does for brochures and the website.",address:"Israel office (digital delivery)",link:"https://example.com/renderlicence",lock:"Yes",subs:"Yes",terms:"Company card",status:"subs",
        hist:[["Submitted","",""],["Head of Design","Approved",""],["Finance","Approved",""]]},
      {po:"PO104",name:"Avi M.",dept:"Tech Field Support",entity:"Israeli company",type:"Specific",vendor:"Local electronics store",items:[{d:"Desk mat, extra large",q:1,p:119}],fees:0,purpose:"Replacement desk mat for a support workstation, the current one is torn.",address:"Israel office, front desk",link:"https://example.com/deskmat",lock:"No",subs:"No",terms:"Company card",status:"finance",
        hist:[["Submitted","",""],["Head of Field Support","Approved",""]]},
      {po:"PO105",name:"Noa B.",dept:"Marketing",entity:"US company",type:"Specific",vendor:"Display supplier",items:[{d:"Showroom display stand",q:2,p:240}],fees:60,purpose:"Stands for the new product samples in the showroom.",address:"Showroom, ground floor",link:"https://example.com",lock:"Maybe",subs:"No",terms:"Net 30 invoice",status:"denied",
        hist:[["Submitted","",""],["Head of Marketing","Denied","The link goes to the vendor homepage, not the product. Resubmit with the exact stand so the right one gets ordered."]]},
      {po:"PO106",name:"Jordan T.",dept:"Operations",entity:"US company",type:"Standard",vendor:"Office furniture supplier",items:[{d:"Task chair, standard model",q:4,p:165}],fees:45,purpose:"Chairs for four desks added in the regional office. Same model as the last order.",address:"Regional office, suite entrance",link:"",lock:"Yes",subs:"No",terms:"Company card",status:"dept",
        hist:[["Submitted","",""]]}
    ];
    s.forEach(function(r){
      r.currency = ENTITIES[r.entity];
      r.hist = r.hist.map(function(h){return {who:h[0],action:h[1],reason:h[2],at:"earlier"};});
      state.reqs.push(r);
    });
    state.mail = [
      {to:"Head of Operations",subj:"ACTION REQUIRED: Approve Purchase Order PO106",body:"Jordan T. requested 4 task chairs. Approve or deny with a reason."},
      {to:"Finance",subj:"FINANCE APPROVAL REQUIRED: Purchase Order PO104",body:"Approved by Head of Field Support. Waiting on Finance."},
      {to:"Purchasing",subj:"READY TO ORDER: Purchase Order PO102",body:"Fully approved. 5 monitors and 5 headsets for the west coast office."}
    ];
  }

  // helpers
  function $(id){return document.getElementById(id);}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function money(n,cur){
    try{return new Intl.NumberFormat("en-US",{style:"currency",currency:cur,maximumFractionDigits:2}).format(n);}
    catch(e){return cur+" "+Number(n).toFixed(2);}
  }
  function totalOf(r){
    var t = r.items.reduce(function(a,i){return a+(Number(i.q)||0)*(Number(i.p)||0);},0);
    return t+(Number(r.fees)||0);
  }
  function what(r){
    var first = r.items[0];
    var s = first.d + (first.q>1?" × "+first.q:"");
    if(r.items.length>1) s += " and "+(r.items.length-1)+" more";
    return s;
  }
  function now(){
    var d=new Date();
    return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  }
  function approverFor(r){
    if(r.status==="dept") return ROUTES[r.dept];
    if(r.status==="finance") return "Finance";
    if(r.status==="subs") return "Subscriptions owner";
    return "";
  }
  function pill(r){
    switch(r.status){
      case "dept": return '<span class="pill wait">With '+esc(ROUTES[r.dept])+'</span>';
      case "finance": return '<span class="pill wait">With Finance</span>';
      case "subs": return '<span class="pill wait">Subscription review</span>';
      case "ready": return '<span class="pill ok">Ready to order</span>';
      case "ordered": return '<span class="pill done">Ordered</span>';
      case "denied": return '<span class="pill no">Denied</span>';
    }
    return "";
  }
  function sendMail(to,subj,body){
    state.mail.unshift({to:to,subj:subj,body:body,fresh:true});
  }

  // tracker
  function tracker(r){
    var steps = ["Submitted","Department head","Finance"];
    if(r.subs==="Yes") steps.push("Subscription review");
    steps.push("Ready to order","Ordered");
    var order = {dept:1,finance:2};
    var idx;
    if(r.subs==="Yes"){order.subs=3;order.ready=4;order.ordered=5;}
    else{order.ready=3;order.ordered=4;}
    var denied = r.status==="denied";
    if(denied){
      // denied at the stage of the last history entry
      var last = r.hist[r.hist.length-1].who;
      idx = last==="Finance"?2:(last==="Subscriptions owner"?3:1);
    } else idx = order[r.status];
    var html = '<div class="track">';
    steps.forEach(function(s,i){
      var c = "step";
      if(denied){ if(i<idx) c+=" past"; else if(i===idx) c+=" fail"; }
      else if(r.status==="ordered"){ c+=" past"; }
      else { if(i<idx) c+=" past"; else if(i===idx) c+=" now"; }
      html += '<div class="'+c+'">'+esc(s)+(denied&&i===idx?"<br>denied":"")+'</div>';
    });
    return html+'</div>';
  }
  function history(r){
    var h = '<ul class="hist">';
    r.hist.forEach(function(e){
      h += '<li><b>'+esc(e.who)+'</b>'+(e.action?' · '+esc(e.action):'')+' <span class="muted">· '+esc(e.at)+'</span>'+(e.reason?'<br><span class="muted">Reason:</span> '+esc(e.reason):'')+'</li>';
    });
    return h+'</ul>';
  }
  function detail(r){
    var items = r.items.map(function(i){return esc(i.d)+" × "+esc(i.q)+" at "+money(i.p,r.currency);}).join("<br>");
    return tracker(r)+
      '<p class="small" style="margin:12px 0 6px"><b>Purpose:</b> '+esc(r.purpose)+'</p>'+
      '<p class="small" style="margin:0 0 6px"><b>Items:</b><br>'+items+(r.fees?'<br>Extra fees '+money(r.fees,r.currency):'')+'</p>'+
      '<p class="small" style="margin:0 0 6px"><b>Deliver to:</b> '+esc(r.address)+' · <b>Vendor:</b> '+esc(r.vendor)+' · <b>Type:</b> '+esc(r.type)+(r.subs==="Yes"?' · Subscription':'')+'</p>'+
      (r.link?'<p class="small" style="margin:0 0 6px;word-break:break-all"><b>Link:</b> '+esc(r.link)+'</p>':'')+
      history(r);
  }

  // renderers
  var openRow = null;
  function render(){
    // counts
    var na = state.reqs.filter(function(r){return r.status==="dept"||r.status==="finance"||r.status==="subs";}).length;
    var nq = state.reqs.filter(function(r){return r.status==="ready";}).length;
    $("c-approve").textContent = na; $("c-approve").className = "count"+(na?"":" zero");
    $("c-queue").textContent = nq; $("c-queue").className = "count"+(nq?"":" zero");

    // approvals
    var ap = "";
    state.reqs.slice().reverse().forEach(function(r){
      if(!(r.status==="dept"||r.status==="finance"||r.status==="subs")) return;
      ap += '<article class="req" data-po="'+r.po+'">'+
        '<span class="acting">You are acting as: '+esc(approverFor(r))+'</span>'+
        '<header><div><span class="po">'+r.po+'</span> · <span class="what">'+esc(what(r))+'</span><div class="meta">'+esc(r.name)+', '+esc(r.dept)+' · '+esc(r.entity)+' · '+esc(r.type)+(r.subs==="Yes"?' · Subscription':'')+'</div></div><div class="po">'+money(totalOf(r),r.currency)+'</div></header>'+
        '<div class="small"><b>Purpose:</b> '+esc(r.purpose)+'</div>'+
        '<div class="small"><b>Deliver to:</b> '+esc(r.address)+(r.link?' · <b>Link attached</b>':'')+'</div>'+
        tracker(r)+
        '<div class="actions"><button type="button" class="btn sm" data-act="approve">Approve</button><button type="button" class="btn deny sm" data-act="denyopen">Deny</button></div>'+
        '<div class="denybox"><label for="why-'+r.po+'">Reason for denial (required, the requester sees this)</label><textarea id="why-'+r.po+'"></textarea><div class="err" style="display:none">A denial needs a reason.</div><div class="actions"><button type="button" class="btn deny sm" data-act="deny">Send denial</button><button type="button" class="btn ghost sm" data-act="denycancel">Cancel</button></div></div>'+
        '</article>';
    });
    $("approvals").innerHTML = ap || '<div class="empty">Nothing waiting. Submit a request to see it land here.</div>';

    // queue
    var q = "";
    state.reqs.slice().reverse().forEach(function(r){
      if(r.status!=="ready") return;
      q += '<article class="req" data-po="'+r.po+'">'+
        '<header><div><span class="po">'+r.po+'</span> · <span class="what">'+esc(what(r))+'</span><div class="meta">For '+esc(r.name)+', '+esc(r.dept)+' · '+esc(r.vendor)+(r.lock==="No"?' (free to source elsewhere)':'')+'</div></div><div class="po">'+money(totalOf(r),r.currency)+'</div></header>'+
        '<div class="small"><b>Deliver to:</b> '+esc(r.address)+' · <b>Pay by:</b> '+esc(r.terms)+'</div>'+
        (r.link?'<div class="small" style="word-break:break-all"><b>Link:</b> '+esc(r.link)+'</div>':'')+
        '<div class="actions"><button type="button" class="btn sm" data-act="order">Mark as ordered</button></div>'+
        '</article>';
    });
    $("queue").innerHTML = q || '<div class="empty">The queue is clear. Approve a request and it shows up here.</div>';

    // table
    var t = "";
    state.reqs.slice().reverse().forEach(function(r){
      t += '<tr class="rowbtn" data-po="'+r.po+'" tabindex="0" aria-expanded="'+(openRow===r.po)+'"><td class="po">'+r.po+'</td><td>'+esc(r.name)+'<div class="meta">'+esc(r.dept)+'</div></td><td>'+esc(what(r))+'</td><td class="amt">'+money(totalOf(r),r.currency)+'</td><td>'+pill(r)+'</td></tr>';
      if(openRow===r.po){
        t += '<tr class="detail"><td colspan="5">'+detail(r)+(r.status==="denied"?'<div class="actions"><button type="button" class="btn sm" data-act="resubmit" data-po="'+r.po+'">Fix and resubmit as new</button></div>':'')+'</td></tr>';
      }
    });
    $("rows").innerHTML = t;

    // mail
    var m = "";
    state.mail.forEach(function(x){
      m += '<li'+(x.fresh?' class="new"':'')+'><span class="to">To: '+esc(x.to)+'</span><span class="subj">'+esc(x.subj)+'</span>'+esc(x.body)+'</li>';
      x.fresh = false;
    });
    $("mail").innerHTML = m;
  }

  // tabs
  function show(tab){
    ["new","approve","queue","all"].forEach(function(t){
      $("p-"+t).hidden = (t!==tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tab"),function(b){
      b.setAttribute("aria-selected", b.getAttribute("data-tab")===tab ? "true":"false");
    });
  }

  // form
  function addItemRow(d,q,p){
    var row = document.createElement("div");
    row.className = "irow";
    row.innerHTML = '<input type="text" aria-label="Item description" placeholder="What exactly?">'+
      '<input type="number" aria-label="Quantity" min="1" step="1" value="1">'+
      '<input type="number" aria-label="Unit price" min="0" step="0.01" placeholder="0.00">'+
      '<button type="button" aria-label="Remove item" title="Remove item">×</button>';
    var ins = row.querySelectorAll("input");
    if(d!=null) ins[0].value = d;
    if(q!=null) ins[1].value = q;
    if(p!=null) ins[2].value = p;
    $("irows").appendChild(row);
  }
  function readItems(){
    return Array.prototype.map.call($("irows").querySelectorAll(".irow"),function(row){
      var ins = row.querySelectorAll("input");
      return {d:ins[0].value.trim(), q:parseFloat(ins[1].value), p:parseFloat(ins[2].value)};
    });
  }
  function radio(name){ var el=document.querySelector('input[name="'+name+'"]:checked'); return el?el.value:""; }
  function setRadio(name,val){ var el=document.querySelector('input[name="'+name+'"][value="'+val+'"]'); if(el) el.checked=true; }
  function refreshForm(){
    var cur = ENTITIES[$("entity").value];
    var items = readItems();
    var t = items.reduce(function(a,i){return a+((i.q||0)*(i.p||0));},0)+(parseFloat($("fees").value)||0);
    $("total").textContent = money(t,cur);
    $("route").textContent = "Routes to: "+ROUTES[$("dept").value]+", then Finance";
    var spec = radio("ptype")==="Specific";
    $("typehint").textContent = spec ? "Equipment, technical parts, or anything you have not ordered before. A direct link is required." : "A repeat purchase or a common office need.";
    $("linkopt").textContent = spec ? "required for Specific" : "optional for Standard";
  }
  function clearErrors(){
    Array.prototype.forEach.call(document.querySelectorAll("#f .bad"),function(e){e.classList.remove("bad");});
    $("errsum").classList.remove("on");
  }
  function blankForm(){
    $("f").reset();
    $("irows").innerHTML = "";
    addItemRow();
    clearErrors();
    refreshForm();
  }
  function fill(o){
    blankForm();
    $("name").value=o.name; $("dept").value=o.dept; $("entity").value=o.entity;
    setRadio("ptype",o.type); $("vendor").value=o.vendor; setRadio("lock",o.lock);
    $("irows").innerHTML="";
    o.items.forEach(function(i){addItemRow(i.d,i.q,i.p);});
    $("fees").value=o.fees||0; $("terms").value=o.terms||"Company card";
    $("purpose").value=o.purpose; $("address").value=o.address; $("link").value=o.link||"";
    setRadio("subs",o.subs||"No");
    refreshForm();
  }
  function validate(){
    clearErrors();
    var bad = [];
    function mark(key,msg){ var el=document.querySelector('#f [data-f="'+key+'"]'); if(el) el.classList.add("bad"); bad.push(msg); }
    if(!$("name").value.trim()) mark("name","Your name is missing.");
    if(!$("vendor").value.trim()) mark("vendor","No vendor named.");
    var items = readItems().filter(function(i){return i.d||i.p;});
    var okItems = items.length>0 && items.every(function(i){return i.d && i.q>0 && i.p>0;});
    if(!okItems) mark("items","Items need a description, quantity and unit price.");
    var p = $("purpose").value.trim();
    if(p.length<15 || VAGUE.indexOf(p.toLowerCase().replace(/[.!]+$/,""))>=0) mark("purpose","The purpose is too vague to approve.");
    if(!$("address").value.trim()) mark("address","No delivery address.");
    var link = $("link").value.trim();
    if(radio("ptype")==="Specific"){
      var ok=false;
      try{ var u=new URL(link); ok = /^https?:$/.test(u.protocol) && (u.pathname.length>1 || u.search.length>1); }catch(e){ ok=false; }
      if(!ok) mark("link","Specific purchases need a direct link to the exact product.");
    }
    if(bad.length){
      $("errsum").innerHTML = "<b>This request would be denied, so the portal stops it here:</b><br>"+bad.map(esc).join("<br>");
      $("errsum").classList.add("on");
      $("errsum").scrollIntoView({block:"nearest",behavior:"smooth"});
      return null;
    }
    return items;
  }
  function submit(e){
    e.preventDefault();
    var items = validate();
    if(!items) return;
    var r = {
      po:"PO"+(seq++), name:$("name").value.trim(), dept:$("dept").value, entity:$("entity").value,
      currency:ENTITIES[$("entity").value], type:radio("ptype"), vendor:$("vendor").value.trim(),
      items:items, fees:parseFloat($("fees").value)||0, purpose:$("purpose").value.trim(),
      address:$("address").value.trim(), link:$("link").value.trim(), lock:radio("lock"),
      subs:radio("subs"), terms:$("terms").value, needby:$("needby").value, status:"dept",
      hist:[{who:"Submitted",action:"",reason:"",at:now()}]
    };
    state.reqs.push(r);
    sendMail(ROUTES[r.dept],"ACTION REQUIRED: Approve Purchase Order "+r.po, r.name+" requested "+what(r)+" ("+money(totalOf(r),r.currency)+"). Approve or deny with a reason.");
    $("formwrap").hidden = true;
    $("donewrap").hidden = false;
    $("donewrap").innerHTML = '<div class="done"><h3>'+r.po+' is in.</h3><p>It went straight to '+esc(ROUTES[r.dept])+'. After that it goes to Finance'+(r.subs==="Yes"?', then subscription review':'')+', then the order queue. You will get an email with the outcome either way.</p>'+tracker(r)+'<div class="actions"><button type="button" class="btn" data-go="approve">Now play the approver</button><button type="button" class="btn ghost" data-go="again">Send another</button></div></div>';
    render();
    $("donewrap").scrollIntoView({block:"nearest",behavior:"smooth"});
  }

  // decisions
  function find(po){ for(var i=0;i<state.reqs.length;i++) if(state.reqs[i].po===po) return state.reqs[i]; return null; }
  function approve(r){
    var who = approverFor(r);
    r.hist.push({who:who,action:"Approved",reason:"",at:now()});
    if(r.status==="dept"){
      r.status="finance";
      sendMail("Finance","FINANCE APPROVAL REQUIRED: Purchase Order "+r.po,"Approved by "+who+". "+what(r)+", "+money(totalOf(r),r.currency)+".");
    } else if(r.status==="finance" && r.subs==="Yes"){
      r.status="subs";
      sendMail("Subscriptions owner","SUBSCRIPTION REVIEW REQUIRED: Purchase Order "+r.po,"Approved by Finance. Check for an existing licence or overlap before this renews forever.");
    } else {
      r.status="ready";
      sendMail("Purchasing","READY TO ORDER: Purchase Order "+r.po, what(r)+" for "+r.name.replace(/\.$/,"")+". Deliver to "+r.address.replace(/\.$/,"")+".");
      sendMail(r.name+" (requester)","APPROVED: Purchase Order "+r.po,"Your request is fully approved and with Purchasing to be ordered.");
    }
  }
  function deny(r,reason){
    var who = approverFor(r);
    r.hist.push({who:who,action:"Denied",reason:reason,at:now()});
    r.status="denied";
    sendMail(r.name+" (requester)","DENIED: Purchase Order "+r.po,"Denied by "+who+". Reason: "+reason.replace(/\.$/,"")+". You can fix this and submit a new request.");
  }

  // events
  document.querySelector(".tabs").addEventListener("click",function(e){
    var b = e.target.closest(".tab"); if(!b) return;
    show(b.getAttribute("data-tab"));
  });
  $("f").addEventListener("submit",submit);
  $("f").addEventListener("input",refreshForm);
  $("f").addEventListener("change",refreshForm);
  $("additem").addEventListener("click",function(){addItemRow();});
  $("irows").addEventListener("click",function(e){
    var b = e.target.closest("button"); if(!b) return;
    if($("irows").children.length>1){ b.parentNode.remove(); } else { b.parentNode.querySelectorAll("input")[0].value=""; b.parentNode.querySelectorAll("input")[2].value=""; }
    refreshForm();
  });
  $("s-good").addEventListener("click",function(){
    fill({name:"Maya S.",dept:"Operations",entity:"US company",type:"Specific",vendor:"Online marketplace",lock:"No",items:[{d:"Label printer, desktop model",q:1,p:129.99},{d:"Label tape, 12 mm, black on white",q:6,p:14.5}],fees:12,purpose:"The shipping desk label printer died. Outgoing parts are being labelled by hand, which is slowing dispatch.",address:"Regional office, shipping desk, weekdays 9 to 5",link:"https://example.com/products/labelprinter410",subs:"No"});
  });
  $("s-sub").addEventListener("click",function(){
    fill({name:"Eli W.",dept:"Marketing",entity:"Canadian company",type:"Specific",vendor:"SEO tool vendor",lock:"Yes",items:[{d:"SEO research tool, monthly plan",q:1,p:129}],fees:0,purpose:"Keyword and competitor research for the Canadian product pages we are launching this quarter.",address:"Digital delivery to the marketing team",link:"https://example.com/pricing/standard",subs:"Yes"});
  });
  $("s-bad").addEventListener("click",function(){
    fill({name:"Chris P.",dept:"Sales",entity:"US company",type:"Specific",vendor:"Not sure",lock:"Maybe",items:[{d:"Tablet",q:1,p:0}],fees:0,purpose:"Needed for work",address:"",link:"https://example.com",subs:"No"});
    validate();
  });
  $("donewrap").addEventListener("click",function(e){
    var b = e.target.closest("[data-go]"); if(!b) return;
    $("donewrap").hidden = true; $("formwrap").hidden = false; blankForm();
    if(b.getAttribute("data-go")==="approve") show("approve");
  });
  $("app").addEventListener("click",function(e){
    var b = e.target.closest("[data-act]"); if(!b) return;
    var act = b.getAttribute("data-act");
    var card = b.closest("[data-po]");
    var r = find(b.getAttribute("data-po") || (card && card.getAttribute("data-po")));
    if(!r) return;
    if(act==="approve"){ approve(r); render(); }
    else if(act==="denyopen"){ card.querySelector(".denybox").classList.add("on"); card.querySelector("textarea").focus(); }
    else if(act==="denycancel"){ card.querySelector(".denybox").classList.remove("on"); }
    else if(act==="deny"){
      var ta = card.querySelector("textarea"); var why = ta.value.trim();
      if(why.length<5){ card.querySelector(".denybox .err").style.display="block"; ta.focus(); return; }
      deny(r,why); render();
    }
    else if(act==="order"){
      r.status="ordered"; r.hist.push({who:"Buyer",action:"Ordered",reason:"",at:now()}); render();
    }
    else if(act==="resubmit"){
      fill({name:r.name,dept:r.dept,entity:r.entity,type:r.type,vendor:r.vendor,lock:r.lock,items:r.items,fees:r.fees,purpose:r.purpose,address:r.address,link:r.link,subs:r.subs,terms:r.terms});
      $("donewrap").hidden = true; $("formwrap").hidden = false;
      show("new");
    }
  });
  function toggleRow(tr){
    var po = tr.getAttribute("data-po");
    openRow = (openRow===po)?null:po;
    render();
  }
  $("rows").addEventListener("click",function(e){
    if(e.target.closest("[data-act]")) return;
    var tr = e.target.closest("tr.rowbtn"); if(tr) toggleRow(tr);
  });
  $("rows").addEventListener("keydown",function(e){
    if(e.key!=="Enter" && e.key!==" ") return;
    var tr = e.target.closest("tr.rowbtn"); if(!tr) return;
    e.preventDefault(); var po = tr.getAttribute("data-po"); toggleRow(tr);
    var again = document.querySelector('tr.rowbtn[data-po="'+po+'"]'); if(again) again.focus();
  });
  $("reset").addEventListener("click",function(){
    seed(); openRow=null; $("donewrap").hidden=true; $("formwrap").hidden=false; blankForm(); render(); show("new");
  });

  // init
  Object.keys(ROUTES).forEach(function(d){ var o=document.createElement("option"); o.textContent=d; $("dept").appendChild(o); });
  Object.keys(ENTITIES).forEach(function(d){ var o=document.createElement("option"); o.textContent=d+" ("+ENTITIES[d]+")"; o.value=d; $("entity").appendChild(o); });
  seed(); blankForm(); render();
})();
