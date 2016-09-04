(function($,undefined){
	$.fn.zyImage = function(options){
		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string') {
			var fn = this[0][options];
			if($.isFunction(fn)){
				return fn.apply(this[0], otherArgs);
			}else{
				throw ("zyImage - No such method: " + options);
			}
		}
		return this.each(function(){  
			var defaults = {
					imgList : [],  // 数据列表
					mainImageWidth  : 700,  // 主图片区域宽度
					mainImageHeight : 400,  // 主图片区域高度
					thumImageWidth  : 170,  // 缩略图片区域宽度
					thumImageHeight : 110,  // 缩略图片区域高度
					
					thumbnails : true,      // 是否显示缩略图
					rotate : true,          // 是否旋转
					zoom : true,            // 是否放大和缩小
					print : true,           // 是否打印
					showNum : true,         // 是否显示总数量和索引
					del : true,             // 是否删除
					changeCallback : function(index, image){  // 切换回调事件
						console.info("插件本身回调方法：");
						console.info("当前选择第"+index+"张图片");
						console.info(image);
					},
					deleteCallback : function(image){  // 删除回调事件
						console.info("删除回调方法：");
						console.info(image);
					}
			};
			var opts = $.extend(defaults,options);
			var self = this;  // 保存自身
			var selectedIndex = 0;  // 当前显示的是第几张图片
			var rotation = 0;  // 图片旋转度数
			var ieRotation = 0;  // ie下图片旋转度数
			var beforeTransform = "";  // 主区域图片旋转属性
			var thumbsLeft = 0;  // 缩略图的left值
			var ie8ImageTop = 0;  // 初始化图片会赋默认值
			var ie8ImageLeft = 0;  // 初始化图片会赋默认值
			var imgListArr = opts.imgList;  // 备份初始化时的图片数据
			var delIndexArr = [];  // 存放删除索引的全局变量
			
			// 初始化环境
			this.init = function(){
				$(this).empty();
				
				// 加载放大缩小js和css
				self.loadZoomJsCss();
				// 创建html
				self.createHtml();
				// 绑定事件
				self.bindEvent();
			};
			
			// 加载放大缩小js和css
			this.loadZoomJsCss = function(){
				// ie8兼容
				if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
					
				}else{
					$.getScript("zoomImage/js/e-smart-zoom-jquery.min.js", function(){
						console.info("zoomImageJS加载完成")
					});
					$("<link>").attr({ rel: "stylesheet",
				        type: "text/css",
				        href: "zoomImage/css/styles.css"
				    }).appendTo("head");
				}
			};
			
			// 创建html
			this.createHtml = function(){
				// 创建主预览区域html
				self.createMainImageHtml();
				
				
				if(opts.thumbnails){
					// 创建缩略图区域html
					self.createThumImageHtml();
				}
			};
			
			// 创建主预览区域html
			this.createMainImageHtml = function(){
				$(self).css({"width":opts.mainImageWidth+"px", "height":(5+opts.mainImageHeight+opts.thumImageHeight)+"px"});
				
				var numHtml = '';
				if(opts.showNum){
					numHtml += '<div class="image_num"></div>';
				}
				
				var delHtml = '';
				if(opts.del){
					delHtml = '<div id="imageDel" class="image_del" title="删除"></div>';
				}
				
				var zoomHtml = '';
				if(opts.zoom){
					zoomHtml += '<div id="imageNarrow" class="image_narrow" title="缩小"></div>';
					zoomHtml += '<div id="imageBig" class="image_big" title="放大"></div>';
				}
				
				var rotatingHtml = '';
				if(opts.rotate){
					rotatingHtml += '<div id="imageRotating" class="image_rotating" title="旋转"></div>';
				}
				
				var printHtml = '';
				if(opts.print){
					printHtml += '<div id="imagePrint" class="image_print" title="打印"></div>';
				}
				
				var optWidth = 0;
				var infoWidth = opts.mainImageWidth-60;
				// 计算图片信息的宽度
				if(opts.del){
					optWidth = optWidth+34;
					infoWidth = infoWidth-34;
				}
				if(opts.zoom){
					optWidth = optWidth+68;
					infoWidth = infoWidth-68;
				}
				if(opts.rotate){
					optWidth = optWidth+34;
					infoWidth = infoWidth-34;
				}
				if(opts.print){
					optWidth = optWidth+34;
					infoWidth = infoWidth-34;
				}
				
				var html = ''; 
				html += '<div class="main_container" style="position: absolute;width:'+opts.mainImageWidth+'px;height:'+opts.mainImageHeight+'px;">';
				html += '	<div class="mc-cbar mc-dir-h">';
				html += '		<div class="mc-bar" style="height: 4px; background-color: #DFDFDF;  opacity: 0;"></div>';
				html += '	</div>';
				html += '	<div class="mc-nav-next mc-ctrl-hide" style="opacity: 0;"></div>';
				html += '	<div class="mc-nav-prev mc-ctrl-hide" style="opacity: 0;"></div>';
				html += '	<div class="image_container" style="width:'+opts.mainImageWidth+'px;height:'+opts.mainImageHeight+'px;"></div>';
				html += '	<div class="main_container_info" style="width:'+opts.mainImageWidth+'px;">';
				html += 		numHtml;
				html += '		<div class="image_info" style="width:'+infoWidth+'px;"></div>';
				html += '		<div class="image_toolbar" style="width:'+optWidth+'px;min-width:'+optWidth+'px;">';
				html += 			printHtml;
				html += 			rotatingHtml;
				html += 			zoomHtml;
				html +=				delHtml;
				html += '		</div>';
				html += '	</div>';
				html += '</div>';
				
				$(self).append(html);
				
				// 1. 先获取图片的信息，其中包括宽高等信息
				self.comImageAttr(opts.imgList[0].src, opts.mainImageWidth, opts.mainImageHeight, {callback:function(imgInfo){  // 参数为一个object对象，其中key为callback的val是一个function方法，并且需要a1方法计算得到的值
					// 2. 获取信息后,初始化图片自适应宽高
					self.initMainImage(imgInfo);
				}},1);
				
				// 3. 根据总数计算进度bar的宽度
				self.initMainBarWidth();
				// 4. 初始化图片信息
				self.initMainImageInfo();
			};
			
			
			// 创建缩略图区域html
			this.createThumImageHtml = function(){
				// 计算thumbs的宽度
				var thumbsLength = opts.imgList.length;
				var width = opts.thumImageWidth*thumbsLength + (thumbsLength-1)*10;
				var bgColor = "#333333";
				
				if(opts.thumBgColor!=undefined){
					bgColor = "#"+opts.thumBgColor;
				}
				
				var html = '';
				html += '<div class="thum_container mc-thumb-list mc-dir-v" style="background-color:'+bgColor+';height:'+opts.thumImageHeight+'px;">';
				html += '	<div class="thum-nav-next thum-ctrl-hide" style="opacity: 0;"></div>';
				html += '	<div class="thum-nav-prev thum-ctrl-hide" style="opacity: 0;"></div>';
				html += '	<div class="mc-thumbs-cont" style="height:'+opts.thumImageHeight+'px;width: '+width+'px;">';
				html += '	</div>';
				html += '</div>';
				$(self).append(html);
				
				// 遍历所有图片，组成缩略图列表
				self.initThumbsList();
			};
			
			// 绑定事件
			this.bindEvent = function(){
				// 绑定主预览区域的事件
				self.bindMainImageEvent();
				
				if(opts.thumbnails){
					// 绑定主预览区域的事件
					self.bindThumImageEvent();
				}
				
			};
			
			// 绑定主预览区域的事件
			this.bindMainImageEvent = function(){
				
				// 显示上一张下一张图标事件
				$(self).find(".main_container").bind({ mouseenter: function(e) {
		        	// 显示
					$(self).find(".main_container .mc-ctrl-hide").css("opacity", 1);
		        }, mouseleave: function(e) {
		        	// 隐藏
		        	$(self).find(".main_container .mc-ctrl-hide").css("opacity", 0);
		        }});
				
				// 绑定上一张点击事件
				$(self).find(".mc-nav-prev").bind("click", function(e){
					if(selectedIndex === 0){  // 当前索引是不是图片的第一张
						console.info("第一张");
					}else{
						selectedIndex = selectedIndex-1;
						
						if(opts.thumbnails){
							// 1.更新缩略图区域信息
							self.updataThumImage("prev");
						}
						
						// 删除原来的  重新设置图片
						// 2. 先获取图片的信息，其中包括宽高等信息
						self.comImageAttr(opts.imgList[selectedIndex].src, opts.mainImageWidth, opts.mainImageHeight, {callback:function(imgInfo){  // 参数为一个object对象，其中key为callback的val是一个function方法，并且需要a1方法计算得到的值
							// 3. 获取信息后,初始化图片自适应宽高
							self.initMainImage(imgInfo);
						}},1);
						// 4.根据索引计算进度bar的left
						self.comMainBarLeft();
						// 5. 初始化图片信息
						self.initMainImageInfo();
					}
					
					// 回调切换事件
					opts.changeCallback(selectedIndex, opts.imgList[selectedIndex]);
					
				});
				
				// 绑定下一张点击事件
				$(self).find(".mc-nav-next").bind("click", function(e){
					
					if(selectedIndex+1 === opts.imgList.length){  // 当前索引是不是图片的最后一个
						console.info("最后了");
					}else{
						selectedIndex = selectedIndex+1;
						
						if(opts.thumbnails){
							// 1.更新缩略图区域信息
							self.updataThumImage("next");
						}
						
						// 删除原来的  重新设置图片
						// 2. 先获取图片的信息，其中包括宽高等信息
						self.comImageAttr(opts.imgList[selectedIndex].src, opts.mainImageWidth, opts.mainImageHeight, {callback:function(imgInfo){  // 参数为一个object对象，其中key为callback的val是一个function方法，并且需要a1方法计算得到的值
							// 3. 获取信息后,初始化图片自适应宽高
							self.initMainImage(imgInfo);
						}},1);
						// 4.根据索引计算进度bar的left
						self.comMainBarLeft();
						// 5. 初始化图片信息
						self.initMainImageInfo();
					}
					
					// 回调切换事件
					opts.changeCallback(selectedIndex, opts.imgList[selectedIndex]);
				});
				
				if(opts.del){
					// 删除事件
					$(self).find("#imageDel").bind("click", function(e){
						$(self).find(".mc-thumb-frame-selected .thumb_del").click();
					});
				}
				
				if(opts.zoom){
					// 绑定放大事件
					$(self).find("#imageBig").bind("click", function(e){
						// ie8兼容
						if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
							// 需要重新计算一下位置、宽度等
							var pos = self.mainImageZoom(opts.mainImageWidth, opts.mainImageHeight, 2);
							
							$(self).find("#imageFullScreen").stop().animate({
								left : pos.left+"px",
								top : pos.top+"px",
								width : pos.width+"px",
								height : pos.height+"px"
							},300);
							
							ie8ImageTop = pos.top;
							ie8ImageLeft = pos.left;
						}else{
							$(self).find("#imageFullScreen").smartZoom("zoom", 0.8);
						}
					});
					
					// 绑定缩小事件
					$(self).find("#imageNarrow").bind("click", function(e){
						// ie8兼容
						if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
							// 需要重新计算一下位置、宽度等
							var pos = self.mainImageZoom(opts.mainImageWidth, opts.mainImageHeight, 0.5);
							
							$(self).find("#imageFullScreen").stop().animate({
								left : pos.left+"px",
								top : pos.top+"px",
								width : pos.width+"px",
								height : pos.height+"px"
							},300);
							
							ie8ImageTop = pos.top;
							ie8ImageLeft = pos.left;
						}else{
							$(self).find("#imageFullScreen").smartZoom("zoom", -0.8);
						}
					});
				}
				
				if(opts.rotate){
					// 绑定旋转事件
					$(self).find("#imageRotating").bind("click", function(e){
						if(beforeTransform===""){
							beforeTransform = $(self).find("#imageFullScreen").css("transform");
						}
						
						rotation = rotation + 90;
						ieRotation = ieRotation + 1;
						// 旋转一次45度
						if(rotation==360){
							rotation = 0;
						}
						if(ieRotation==4){
							ieRotation = 0;
						}
						
						$(self).find("#imageFullScreen").css({
							"transform-origin" : "50% 50%",
							"-ms-transform-origin" : "50% 50%",
							"-webkit-transform-origin" : "50% 50%",
							"-moz-transform-origin" : "50% 50%",
							"-o-transform-origin" : "50% 50%",
							"-moz-transform" : beforeTransform+" rotate("+rotation+"deg)",
							"-webkit-transform" : beforeTransform+" rotate("+rotation+"deg)",
							"filter" : "progid:DXImageTransform.Microsoft.BasicImage(rotation="+ieRotation+")"
						});
					});
				}
				
				if(opts.print){
					// 绑定打印事件
					$(self).find("#imagePrint").bind("click", function(e){
						
					});
				}
			};
			
			// 绑定缩略图区域的事件
			this.bindThumImageEvent = function(){
				// 显示上一张下一张图标事件
				$(self).find(".thum_container").bind({ mouseenter: function(e) {
		        	// 显示
					$(self).find(".thum_container .thum-ctrl-hide").css("opacity", 1);
		        }, mouseleave: function(e) {
		        	// 隐藏
		        	$(self).find(".thum_container .thum-ctrl-hide").css("opacity", 0);
		        }});
				
				// 绑定上一张点击事件
				$(self).find(".thum-nav-prev").bind("click", function(e){
					if(selectedIndex === 0){  // 当前索引是不是图片的第一张
						console.info("第一张");
					}else{
						selectedIndex = selectedIndex-1;

						// 设置缩略图选中
						self.setThumSelected();
						
						// 根据当前缩略图的索引去移动缩略图位置
						self.moveThumbById("prev");
						// 更新主预览区域信息
						self.updateMainImage();
					}
					
					// 回调切换事件
					opts.changeCallback(selectedIndex, opts.imgList[selectedIndex]);
					
				});
				
				// 绑定下一张点击事件
				$(self).find(".thum-nav-next").bind("click", function(e){
					
					if(selectedIndex+1 === opts.imgList.length){  // 当前索引是不是图片的最后一个
						console.info("最后了");
					}else{
						selectedIndex = selectedIndex+1;
						
						// 设置缩略图选中
						self.setThumSelected();
						
						// 根据当前缩略图的索引去移动缩略图位置
						self.moveThumbById("next");
						// 更新主预览区域信息
						self.updateMainImage();
					}
					
					// 回调切换事件
					opts.changeCallback(selectedIndex, opts.imgList[selectedIndex]);
				});
				
				// 绑定每个缩略图的显示事件
				$(self).find(".mc-thumb-frame").bind({ mouseenter: function(e) {
		        	// 显示
					$(this).css("opacity", 0.7);
					$(this).find(".mc-thumb-ol").css("z-index","99");
		        }, mouseleave: function(e) {
		        	// 隐藏
		        	$(this).css("opacity", 0.5);
		        	$(this).find(".mc-thumb-ol").css("z-index","0");
		        }});
				
				
				// 绑定每个缩略图的单击事件
				$(self).find(".mc-thumb-frame").live("click", function(e){
					// 首先判断当前是不是已经选中
					var $thum = $(this);
					if(!$thum.hasClass("mc-thumb-frame-selected")){  // 当前不是选中的
						if(parseInt($thum.attr("imgIndex")) > selectedIndex){  // next
							// 更新当前索引
							selectedIndex = parseInt($thum.attr("imgIndex"));
							// 设置缩略图选中
							self.setThumSelected();
							// 根据当前缩略图的索引去移动缩略图位置
							self.moveThumbById("next");
						}else{  // prev
							// 更新当前索引
							selectedIndex = parseInt($thum.attr("imgIndex"));
							// 设置缩略图选中
							self.setThumSelected();
							// 根据当前缩略图的索引去移动缩略图位置
							self.moveThumbById("prev");
						}
						
						// 更新主预览区域信息
						self.updateMainImage();
					}
					
					// 回调切换事件
					opts.changeCallback(selectedIndex, opts.imgList[selectedIndex]);
				});
				
				if(opts.del){
					// 绑定删除事件
					$(self).find(".thumb_del").live("click", function(event){
						var delNowIndex = parseInt($(this).parents(".mc-thumb-frame").attr("nowindex"));
						var delIndex = parseInt($(this).attr("marIndex"));
						
						// 1.遍历备份图片，找出没有被删除的图片，重新放入opts.imgList中
						delIndexArr.push(delIndex);
						var tempArr = [];
						for(var i=0; i<imgListArr.length; i++){
							if(jQuery.inArray(i, delIndexArr)==-1){
								tempArr.push(imgListArr[i]);
							}
						}
						opts.imgList = tempArr;
						// 2.删除html
						$(this).parents(".mc-thumb-frame").remove();
						// 3.重新设置索引
						// 更新一下缩略图的当前索引
						self.updateThumNowIndex(); 
						if(delNowIndex == opts.imgList.length){
							// 当前删除最后一个，要向前选
							selectedIndex = delNowIndex-1;
						}else{
							// 要想后选
							selectedIndex = delNowIndex;
						}
						// 4.更新缩略图和主预览图
						self.updateMainImage();
						if(delNowIndex == opts.imgList.length){
							// 当前删除最后一个，要向前选
							self.setThumSelected();
							// 判断剩下的图片的总宽度加起来是不是大于opts.mainImageWidth的宽度
							if($(self).find(".mc-thumbs-cont").position().left<0){
								// 当前图片不完整
								thumbsLeft = thumbsLeft + opts.thumImageWidth;
								// ie8兼容
								if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
									$(self).find(".mc-thumbs-cont").stop().animate({left:thumbsLeft+"px"},300);
								}else{
									// 当前图片不完整
									$(self).find(".mc-thumbs-cont").css("left", thumbsLeft+"px");
								} 
							}
						}else{
							// 要想后选
							self.updataThumImage("next");
						}
						
						// 回调删除事件
						opts.deleteCallback(opts.imgList[selectedIndex]);
						
						event.stopPropagation();    //  阻止事件冒泡
					});
				}
				
			};
			
			// 更新一下缩略图的当前索引
			this.updateThumNowIndex = function(){
				$.each($(self).find(".mc-thumb-frame"), function(k, v){
					$(this).attr("nowIndex", k);
				});
			};
			
			
			// 更新主预览区域信息
			this.updateMainImage = function(){
				// 删除原来的  重新设置图片
				if(selectedIndex==-1){
					$(self).find("#imageFullScreen").attr("src","");
					$(self).find(".image_num").html("0/0");
					$(self).find(".image_info").html("暂无图片信息");
				}else{
					// 1. 先获取图片的信息，其中包括宽高等信息
					self.comImageAttr(opts.imgList[selectedIndex].src, opts.mainImageWidth, opts.mainImageHeight, {callback:function(imgInfo){  // 参数为一个object对象，其中key为callback的val是一个function方法，并且需要a1方法计算得到的值
						// 2. 获取信息后,初始化图片自适应宽高
						self.initMainImage(imgInfo);
					}},1);
					// 3.根据索引计算进度bar的left
					self.comMainBarLeft();
					// 4. 初始化图片信息
					self.initMainImageInfo();
				}
			};
			
			// 更新缩略图区域信息
			// 移动方向
			this.updataThumImage = function(direction){
				// 设置缩略图选中
				self.setThumSelected();
				
				// 根据方向移动位置
				self.moveThumbById(direction);
			};
			
			// 设置缩略图选中
			this.setThumSelected = function(){
				// ie8做兼容
				if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
					// 添加ie8可以识别的样式
					$(self).find(".ie8-mc-thumb-frame-selected").removeClass("ie8-mc-thumb-frame-selected");
					$(self).find(".mc-thumb-frame").eq(selectedIndex).find(".mc-thumb").addClass("ie8-mc-thumb-frame-selected");
				}else{
					$(self).find(".mc-thumb-frame-selected").removeClass("mc-thumb-frame-selected");
					$(self).find(".mc-thumb-frame").eq(selectedIndex).addClass("mc-thumb-frame-selected");
				}
			};
			
			// 计算图片的left、top、width、height
			// src 图片路径
			// pw 父div的宽度
			// ph 父div的高度
			// cb 回调方法
			// sort 类型，是主图片1还是缩略图2
			this.comImageAttr = function(src, pw, ph, cb, sort){
				var img = new Image();
				//img.src = src;  兼容ie8写到了onload方法下面
				img.onload = function(){
					var w = 0;
					var h = 0;
					var l = 0;
					var t = 0;
					if(sort==2){
						ph = ph-10;
					}
					
					if(img.width>0 && img.height>0){
						var rate = (pw/img.width < ph/img.height)?pw/img.width:ph/img.height;
						if(rate <= 1){   
						    w = img.width*rate;
						    h = img.height*rate;
						}else{
						    w = img.width;
						    h = img.height;
						}
					}
					
					// 计算位置
					l = Math.round((pw-w)/2);
					if(sort==1){
						t = Math.round((ph-h)/2);
					}else{
						t = Math.round(((ph+10)-h)/2);
					}
					
					// 因为onload是异步的，所以采用回调的方法返回值
					var callback = cb?cb.callback:null;  // 获取参数对象中的回调方法
				    if($.isFunction(cb.callback)){  // 如果有回调方法
				    	// 返回一个计算后的数据，方便回调方法使用它
				        callback({"src":src, "width":w, "height":h, "left":l, "top":t});  
				    }
				}
				img.src = src;
			};
			
			// 主图片预览的放大缩小功能
			// pw 父div的宽度
			// ph 父div的高度
			// rate 图片放大缩小的比例
			this.mainImageZoom = function(pw, ph, rate){
				var img = $(self).find("#imageFullScreen")[0];
				var w = img.width*rate;
				var h = img.width*rate;
				var l = Math.round((pw-w)/2);
				var t = Math.round((ph-h)/2);
				
				return {"width":w, "height":h, "left":l, "top":t};
			};
			
			
			// 初始化图片
			// imgInfo 图片的信息
			this.initMainImage = function(imgInfo){
				// 给图片设置width和height
				$(self).find(".image_container").empty();
				
				if(opts.mainBgColor!=undefined){
					// 设置背景颜色
					$(self).find(".image_container").css("background-color", "#"+opts.mainBgColor+"!important");
				}else{
					$(self).find(".image_container").css("background-color", "#000000");
				}
				
				// 做ie8兼容
				if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
					var html = '<img id="imageFullScreen" class="image_item" src="'+imgInfo.src+'" style="position: absolute;left:'+imgInfo.left+'px;width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;" />';
				
					$(self).find(".image_container").append(html);
					
					ie8ImageTop = imgInfo.top;
					ie8ImageLeft = imgInfo.left;
					var element = $(self).find("#imageFullScreen");  
					// 给元素绑定鼠标按下事件
					element.bind("mousedown", self.mouseDown);
					
				}else{
					var html = '<img id="imageFullScreen" class="image_item" src="'+imgInfo.src+'" style="transform: translate3d('+imgInfo.left+'px, 0px, 0px) scale3d(1, 1, 1);width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;" />';
					
					$(self).find(".image_container").append(html);
					
					// 初始化图片放大拖动
					$(self).find("#imageFullScreen").smartZoom({"containerClass":"zoomableContainer"});
				}
			};
			
			var mouseStart = {};
			this.mouseDown = function(e){
				var $element = $(self).find("#imageFullScreen");
				// 得到鼠标据div的left
				mouseStart["x"] = e.clientX;
	            mouseStart["y"] = e.clientY;
				// div鼠标样式更改
				$element.css("cursor", "move");
				// 绑定鼠标的移动的松开事件
				$(document).bind("mousemove", self.mouseMove);
		        $(document).bind("mouseup", self.mouseUp);
				e.stopPropagation();
				e.preventDefault();
			};
			
			this.mouseMove = function(e){
				var $element = $(self).find("#imageFullScreen");
				
				// 得到鼠标据div的left
				var mX = e.pageX-($element.offset().left-ie8ImageLeft);
				var mY = e.pageY-($element.offset().top-ie8ImageTop);
				
				var l = mX - mouseStart.x + $element.offset().left;
				var t = mY - mouseStart.y + $element.offset().top;
				
				$element.css({
					"position" : "absolute",
					"top" : t+"px",
		        	"left" : l+"px"
				});
				e.stopPropagation();
				e.preventDefault();
			};
			
			this.mouseUp = function(e){
				var $element = $(self).find("#imageFullScreen");
				
				// 得到鼠标据div的left
				ie8ImageTop = $element.offset().top-($element.offset().top-$element.position().top);
				ie8ImageLeft = $element.offset().left-($element.offset().left-$element.position().left);
				
			    // 解除绑定
			    $(document).unbind("mousemove", self.mouseMove);
				$(document).unbind("mouseup", self.mouseUp);
				e.stopPropagation();
				e.preventDefault();
			};
			
			// 根据总数计算进度bar的宽度
			this.initMainBarWidth = function(){
				// 计算bar的宽度
				var barWidth = Math.floor(opts.mainImageWidth / opts.imgList.length);
				$(self).find(".mc-bar").css({
					"width" : barWidth+"px",
					"opacity" : 0
				});
			};
			
			var st;
			// 根据索引计算进度bar的left
			this.comMainBarLeft = function(){
				// 首先停止之前的setTimeout事件
				clearTimeout(st);
				var $bar = $(self).find(".mc-bar");
				var left = $bar.width()*selectedIndex;
				
				// ie8做兼容
				if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
					$bar.css("position", "relative");
					$bar.stop().animate({left:left+"px",opacity:1},300);
				}else{
					$bar.css({
						"transform" : "translateX("+left+"px) translateZ(0px)",
						"opacity" : 1
					});
				}
				
				// 把setTimeout付给st方便停止事件
				st = setTimeout(function(){
					$bar.css("opacity", 0);
				},500);
			};
			
			// 初始化图片信息
			this.initMainImageInfo = function(){
				// 根据索引设置当前图片的信息
				if(opts.showNum){
					$(self).find(".image_num").html((selectedIndex+1)+"/"+opts.imgList.length);
				}
				$(self).find(".image_info").html(opts.imgList[selectedIndex].content);
			};
			
			var onloadFlag = 0;  // 因为onload是异步加载
			// 生成缩略图列表
			this.initThumbsList = function(){
				$.each(opts.imgList, function(k,v){
					// 1.因为onload是异步加载，所以先建好父div，当图片加载完后再添加到父div中
					var divHtml = '';
					if(k==0){
						// ie8兼容
						if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
							divHtml += '<div class="mc-thumb-frame" nowIndex="'+k+'" imgIndex="'+k+'" style="position: relative;width:'+opts.thumImageWidth+'px;height:'+opts.thumImageHeight+'px;">';
							divHtml += '</div>';
						}else{
							divHtml += '<div class="mc-thumb-frame mc-thumb-frame-selected" nowIndex="'+k+'" imgIndex="'+k+'" style="position: relative;width:'+opts.thumImageWidth+'px;height:'+opts.thumImageHeight+'px;">';
							divHtml += '</div>';
						}
					}else{
						divHtml += '<div class="mc-thumb-frame" nowIndex="'+k+'" imgIndex="'+k+'" style="position: relative;width:'+opts.thumImageWidth+'px;height:'+opts.thumImageHeight+'px;">';
						divHtml += '</div>';
					}
					$(self).find(".mc-thumbs-cont").append(divHtml);
					
					// 2.生成同比例大小后的图片
					self.comImageAttr(opts.imgList[k].src, opts.thumImageWidth, opts.thumImageHeight, {callback:function(imgInfo){  // 参数为一个object对象，其中key为callback的val是一个function方法，并且需要a1方法计算得到的值
						var imgHtml = '';
						// ie8兼容
						if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
							if(k==0){
								if(opts.del){
									imgHtml += self.createThumbInfoCon(k, imgInfo);
								}
								imgHtml += '<img class="mc-thumb ie8-mc-thumb-frame-selected" alt="thumb" src="'+imgInfo.src+'" style="position: relative;left:'+imgInfo.left+'px;top:'+imgInfo.top+'px;width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;">';
							}else{
								if(opts.del){
									imgHtml += self.createThumbInfoCon(k, imgInfo);
								}
								imgHtml += '<img class="mc-thumb" alt="thumb" src="'+imgInfo.src+'" style="position: relative;left:'+imgInfo.left+'px;top:'+imgInfo.top+'px;width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;">';
							}
						}else{
							if(opts.del){
								imgHtml += self.createThumbInfoCon(k, imgInfo);
							}
							imgHtml += '<img class="mc-thumb" alt="thumb" src="'+imgInfo.src+'" style="position: relative;left:'+imgInfo.left+'px;top:'+imgInfo.top+'px;width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;">';
						}
						$(self).find(".mc-thumbs-cont .mc-thumb-frame[imgindex='"+k+"']").append(imgHtml);
					}},2);
				});
			};
			
			// 根据索引生成缩略图的信息div返回html代码
			this.createThumbInfoCon = function(index, imgInfo){
				var html = '';
				html += '<div class="mc-thumb-ol" tIndex="'+index+'" style="position: absolute;left:'+imgInfo.left+'px;top:'+imgInfo.top+'px;width:'+imgInfo.width+'px;height:'+imgInfo.height+'px;">';
				html += '	<div class="thumb_del" marIndex="'+index+'"></div>';
				html += '	<div class="thumb_info">'+opts.imgList[index].content+'</div>';
				html += '</div>';
				
				return html;
			};
			
			// 根据当前缩略图的索引去移动缩略图位置
			// direction 移动方向
			this.moveThumbById = function(direction){
				if(direction=="next"){
					// 判断当前图片是不是显示不完整
					if(opts.mainImageWidth <= opts.thumImageWidth*(selectedIndex+1)){
						// 是不是已经next移动过了，然后又prev回来，再次next
						if(opts.thumImageWidth*(selectedIndex+1)+thumbsLeft>=opts.mainImageWidth){  // 不是，移动
							// 由于css设置了动画300ms动作，所以使用jquery获取left值会有误差
							// 所以设置一个保存thumbs div的left值的全局变量，每次对他修改值来代替
							// 使用jquery获取thumbs div的left值
							thumbsLeft = thumbsLeft - opts.thumImageWidth;
							// ie8兼容
							if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
								$(self).find(".mc-thumbs-cont").stop().animate({left:thumbsLeft+"px"},300);
							}else{
								// 当前图片不完整
								$(self).find(".mc-thumbs-cont").css("left", thumbsLeft+"px");
							}
						}
					}
				}else if(direction=="prev"){
					// 判断当前图片是不是显示不完整
					if(-((selectedIndex+1)*opts.thumImageWidth) >= thumbsLeft){
						// 当前图片不完整
						thumbsLeft = thumbsLeft + opts.thumImageWidth;
						
						// ie8兼容
						if(navigator.appName == "Microsoft Internet Explorer" && navigator.appVersion.match(/8./i)=="8."){
							$(self).find(".mc-thumbs-cont").stop().animate({left:thumbsLeft+"px"},300);
						}else{
							// 当前图片不完整
							$(self).find(".mc-thumbs-cont").css("left", thumbsLeft+"px");
						}
					}
				}
			};
			
			// 提供给外部获取选中图片的便捷方法
			this.getSelectedImage = function(){
				return {"index":selectedIndex+1, "imageInfo":opts.imgList[selectedIndex]};
			};
			
			this.init();
			
		});
	};
	
	
	
})(jQuery);