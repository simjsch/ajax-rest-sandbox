$(function () {
    var $loading = $('#loading').hide();
    $(document)
        .ajaxStart(function () {
            $loading.show();
        })
        .ajaxStop(function () {
            $loading.hide();
        });

    WorkSiteBrowser.Init();

    $("#browse").click(function () {
        var folders = WorkSiteBrowser.SelectFolders();

        if (folders) {
            if (0 === $("#folder-template").length) {
                var path = '//' + location.host + location.pathname.substring(0, location.pathname.lastIndexOf("/")) + "/FolderTemplate.html";

                $.ajax({
                    async: false,
                    type: 'GET',
                    url: path,
                    success: function (data) {
                        $(data).appendTo("body");
                    }
                });
            }
            WorkSiteFolders.Insert(folders);
        }
    });
});

var WorkSiteFolders = function () {
    var _updatePostData = function () {
        //var params = {};
        //$("#aspnetForm").find("input")
        //                  .filter("[id^='hdn-objectid-'],[id^='hdn-description-'],[id^='hdn-type-'],[id^='chk-latest-']")
        //                  .each(function (i, e) {
        //                      params[e.id] = e.value;
        //                  });
        //$("#ctl00_PlaceHolderMain_hdnFormData").val($.param(params));
    }

    var _loadSummary = function (index) {
        var path = "http://localhost/TestService/api/summary/5";

        $.ajax({
            async: false,
            type: 'GET',
            url: path,
            dataType: 'json',
            success: function (summary) {
                $("#folder-template").find("#id-pbs-" + index).text(summary.prj_id);
                $("#folder-template").find("#name-pbs-" + index).text(summary.name);
                $("#folder-template").find("#type-pbs-" + index).text(summary.type);
                $("#folder-template").find("#subfolders-pbs-" + index).text(summary.subfolders);
                $("#folder-template").find("#documents-pbs-" + index).text(summary.documents);
            }
        });
    }

    var _showDetails = function (id) {
        var index = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + index);
        var summaryRow = hidden.parents("div.well").find("div:nth-child(1)");
        var buttonRow = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsRow = hidden.parents("div.well").find("div:nth-child(3)");
        var prjId = summaryRow.find("#id-pbs-" + index).text();
        var tree = detailsRow.find("#tree-pbs-" + index);
        if (tree.is(":empty")) {
            tree.fancytree({
                checkbox: true,
                selectMode: 3,
                source: {
                    url: 'http://localhost/TestService/api/folders/' + prjId,
                    cache: false
                },
                cookieId: "fancytree-Cb" + index,
                idPrefix: "fancytree-Cb" + index + "-"
            });

            detailsRow.find("#btn-selectall-pbs-" + index).click(function () {
                tree.fancytree("getTree").visit(function (node) {
                    node.setSelected(true);
                });
                return false;
            });

            detailsRow.find("#btn-deselectall-pbs-" + index).click(function () {
                tree.fancytree("getTree").visit(function (node) {
                    node.setSelected(false);
                });
                return false;
            });

            detailsRow.find("#btn-removeselected-pbs-" + index).click(function () {
                var ftree = tree.fancytree("getTree");
                var nodes = ftree.getSelectedNodes();
                nodes.forEach(function (node) {
                    while (node.hasChildren()) {
                        node.getFirstChild().moveTo(node.parent, "child");
                    }
                    node.remove();
                });
                return false;
            });
        }
        detailsRow.show();
        var button = buttonRow.find("#btn-showdetails-pbs-" + index);
        button.text("Hide Details");
        button.attr("onClick", "WorkSiteFolders.HideDetails(this.id); return false;");
    }

    var _hideDetails = function (id) {
        var index = id.replace("btn-showdetails-pbs-", "");
        var hidden = $("#main").find("#hdn-objectid-pbs-" + index);
        var buttonPanel = hidden.parents("div.well").find("div:nth-child(2)");
        var detailsPanel = hidden.parents("div.well").find("div:nth-child(3)");
        detailsPanel.hide();
        var button = buttonPanel.find("#btn-showdetails-pbs-" + index);
        button.text("Show Details");
        button.attr("onClick", "WorkSiteFolders.ShowDetails(this.id); return false;");
    }

    var _insert = function (folders) {
        $.each(folders, function (i, e) {
            $("#main").append(function () {
                var indexOld = 0;
                var exists = false;
                var currentFolders = $("#main").find("input[id^='hdn-objectid-pbs-']");
                currentFolders.each(function () {
                    var id = this.id.replace("hdn-objectid-pbs-", "");
                    indexOld = Math.max(indexOld, parseInt(id));
                    if (e === this.value) exists = true;
                });

                if (!exists) {
                    var index = indexOld + 1;
                    var template = $("#folder-template");
                    template.find("[id$='pbs-" + indexOld + "']").each(function () {
                        this.id = this.id.replace(indexOld, index);
                    });
                    _loadSummary(index);

                    template.find("#hdn-objectid-pbs-" + index).val(e);
                    template.find("#btn-showdetails-pbs-" + index).attr("onclick", "WorkSiteFolders.ShowDetails(this.id); return false;");
                    template.find("#btn-remove-pbs-" + index).attr("onclick", "WorkSiteFolders.Remove(this.id); return false;");

                    return template.html();
                }
            });
        });
    }

    var _remove = function (id) {
        var index = id.replace("btn-remove-pbs-", "");
        var panel = $("#main").find("#hdn-objectid-pbs-" + index).closest("div.container");
        panel.fadeOut("slow", function () {
            panel.remove();
        });
    }

    return {
        Insert: function (folders) {
            _insert(folders);
            _updatePostData();
        },

        Remove: function (id) {
            _remove(id);
            _updatePostData();
        },

        ShowDetails: function (id) {
            _showDetails(id);
        },

        HideDetails: function (id) {
            _hideDetails(id);
        },

        RemoveSelected: function (id) {

        }
    }
}();