$(function(){
	var imgList = [
	                {"content":"1号图片", "src":"demoImage/1.jpg"},
	                {"content":"2号图片", "src":"demoImage/2.jpg"},
	                {"content":"3号图片", "src":"demoImage/3.jpg"},
	                {"content":"4号图片", "src":"demoImage/4.jpg"},
	                {"content":"5号图片", "src":"demoImage/5.jpg"},
	                {"content":"6号图片", "src":"demoImage/6.jpg"},
	                {"content":"7号图片", "src":"demoImage/7.jpg"},
	                {"content":"8号图片", "src":"demoImage/8.jpg"}
	              ];
	
	$("#panImage").zyImage({   
		imgList : imgList,        // 数据列表
//		mainBgColor     : "ffffff", // 主图片区域背景颜色*需要6位
//		thumBgColor     : "ffffff", // 缩略图片区域背景颜色*需要6位
		mainImageWidth  : 600,    // 主图片区域宽度
		mainImageHeight : 330,    // 主图片区域高度
		thumImageWidth  : 110,    // 缩略图片区域宽度
		thumImageHeight : 110,    // 缩略图片区域高度
		
		thumbnails : true,        // 是否显示缩略图
		rotate : true,            // 是否旋转
		zoom : true,              // 是否放大和缩小
		print : false,             // 是否打印
		showNum : true,           // 是否显示总数量和索引
		del : true,               // 是否可以删除
		changeCallback : function(index, image){  // 切换回调事件
			console.info("外部回调方法：");
			console.info("当前选择第"+index+"张图片");
			console.info(image);
		},
		deleteCallback : function(image){  // 删除回调事件
			console.info("删除回调方法：");
			console.info(image);
		}
	});
});