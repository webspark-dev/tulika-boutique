-- Tulika demo content. Placeholder photo paths render as inline SVG in the storefront.
insert into public.categories(slug,name_bn,name_en,sort_order,visible) values
('saree','শাড়ি','Saree',1,true),
('kurti','কুর্তি','Kurti',2,true),
('lehenga','লেহেঙ্গা','Lehenga',3,true),
('gown','গাউন','Gown',4,true),
('kids','শিশুদের পোশাক','Kids',5,true),
('accessories','অ্যাক্সেসরিজ','Accessories',6,true)
on conflict(slug) do update set name_bn=excluded.name_bn,name_en=excluded.name_en,sort_order=excluded.sort_order,visible=true;

insert into public.settings(id,boutique_name,tagline_bn,tagline_en,about_bn,about_en,address,phone,whatsapp_number,hours_bn,hours_en,shipping_charge,free_shipping_threshold,hero_bn,hero_en)
values(true,'তুলিকা','নিজস্বতা, বুনন আর রঙের গল্প — প্রতিটি পোশাকে থাকুক আপনার ছোঁয়া।','Stories in color and weave — a little of you in every piece.',
'কলকাতার হৃদয়ে, তুলিকা তৈরি করে এমন পোশাক যা ঐতিহ্যকে ছুঁয়ে থাকে, অথচ প্রতিদিনের জীবনে সহজ। যত্নে বেছে নেওয়া রং, আরামদায়ক বুনন আর আপনার নিজস্বতার জন্য একটুখানি জায়গা — এটাই আমাদের গল্প।',
'At the heart of Kolkata, Tulika creates pieces that carry a touch of tradition and feel easy in everyday life. Thoughtful colors, comfortable weaves and room for your own style — that is our story.',
'১২, গড়িয়াহাট রোড, কলকাতা ৭০০০১৯','+91 98765 43210','919876543210','সোম–শনি · সকাল ১১টা–রাত ৮টা','Mon–Sat · 11 am–8 pm',80,2500,'রঙে বুননে|আপনার গল্প','A story|in every thread')
on conflict(id) do nothing;

insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'neelpadma-jamdani','নীলপদ্ম জামদানি','Neelpadma Jamdani','হাতের বুননে নীলের কোমল ছোঁয়া, উৎসব ও প্রতিদিনের জন্য।','A soft touch of indigo in a handwoven drape, for celebrations and everyday.',4850,null,true,true,true from public.categories c where c.slug='saree'
on conflict(slug) do nothing;
insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'krishnachura-kurti','কৃষ্ণচূড়া কুর্তি','Krishnachura Kurti','হালকা সুতির আরাম, লাল ফুলের নকশায়।','Easy cotton comfort with a little flourish of red blooms.',1650,1490,true,false,true from public.categories c where c.slug='kurti'
on conflict(slug) do nothing;
insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'sonajhuri-lehenga','সোনাঝুরি লেহেঙ্গা','Sonajhuri Lehenga','গাঁদা রঙের সুতোর কাজে বিয়েবাড়ির জন্য বিশেষ।','Golden-thread detail made for a day worth remembering.',8200,null,false,true,true from public.categories c where c.slug='lehenga'
on conflict(slug) do nothing;
insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'chander-alo-gown','চাঁদের আলো গাউন','Chander Alo Gown','সন্ধ্যার নিমন্ত্রণে শান্ত, সাবলীল আভিজাত্য।','Quiet, effortless elegance for an evening invitation.',5600,null,false,false,true from public.categories c where c.slug='gown'
on conflict(slug) do nothing;
insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'rongtuli-kids-set','রঙতুলি ছোটদের সেট','Rongtuli Kids Set','নরম কাপড়ে রঙিন দিনযাপনের পোশাক।','Soft, playful clothing for their colorful little days.',1250,null,true,false,true from public.categories c where c.slug='kids'
on conflict(slug) do nothing;
insert into public.products(category_id,slug,name_bn,name_en,description_bn,description_en,price,discount_price,is_new,featured,visible)
select c.id,'shiuli-embroidered-tote','শিউলি হাতের কাজের ঝোলা','Shiuli Handworked Tote','হাতে সেলাই করা ছোট ফুল, সঙ্গে রাখুন প্রতিদিন।','Hand-stitched little blooms to carry with you every day.',890,null,false,false,true from public.categories c where c.slug='accessories'
on conflict(slug) do nothing;

insert into public.product_images(product_id,storage_path,alt_bn,alt_en,sort_order)
select p.id,'demo-'||p.slug||'.svg',p.name_bn,p.name_en,0 from public.products p
on conflict(storage_path) do nothing;

insert into public.product_sizes(product_id,size,stock)
select p.id,s.size,s.stock
from public.products p
cross join lateral (values
 ('Free',8),('S',4),('M',6),('L',4),('XL',2)
) as s(size,stock)
where p.slug in ('neelpadma-jamdani','krishnachura-kurti','sonajhuri-lehenga','chander-alo-gown','rongtuli-kids-set','shiuli-embroidered-tote')
  and (p.slug not in ('shiuli-embroidered-tote') or s.size='Free')
  and (p.slug not in ('neelpadma-jamdani','shiuli-embroidered-tote') or s.size='Free')
on conflict(product_id,size) do nothing;

insert into public.reviews(customer_name,text_bn,text_en,rating,visible) values
('মৌসুমী','শাড়িটা হাতে পেয়ে আরও সুন্দর লেগেছে। কাপড়ের আরাম আর ব্যবহার — দুটোই দারুণ।','The saree is even lovelier in person. Beautifully comfortable and so easy to wear.',5,true),
('Ananya','কুর্তির রং আর ফিট দুটোই একদম আমার মনের মতো। আবার আসব!','The color and fit are exactly what I wanted. I will be back!',5,true),
('শ্রেয়া','খুব যত্ন করে প্যাক করা হয়েছিল, আর দোকানের ব্যবহারও ভীষণ আন্তরিক।','Thoughtfully packed, and the team was so warm and helpful.',5,true)
on conflict do nothing;
