function addScheduleItem() {
    var schedule_item = jQuery('#schedule_item').html();
    var html = '<span>' + schedule_item + '<a href="javascript:;" onclick="jQuery(this).parent().remove()"><i class="icon-minus"></i> remove</a><div class="sep"></div></span>';
    jQuery('#course_reper').before(html);
}