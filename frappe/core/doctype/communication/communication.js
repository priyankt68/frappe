frappe.ui.form.on("Communication", {
	onload: function(frm) {
		if(frm.doc.content) {
			frm.doc.content = frappe.dom.remove_script_and_style(frm.doc.content);
		}
		frm.set_query("reference_doctype", function() {
			return {
				filters: {
					"issingle": 0,
					"istable": 0
				}
			}
		});
	},
	refresh: function(frm) {
		if(frm.is_new()) return;

		frm.convert_to_click && frm.set_convert_button();
		frm.subject_field = "subject";

		if(frm.doc.reference_doctype && frm.doc.reference_name) {
			frm.add_custom_button(__(frm.doc.reference_name), function() {
				frappe.set_route("Form", frm.doc.reference_doctype, frm.doc.reference_name);
			});
		} else {
			// if an unlinked communication, set email field
			if (frm.doc.sent_or_received==="Received") {
				frm.email_field = "sender";
			} else {
				frm.email_field = "recipients";
			}
		}

		if(frm.doc.status==="Open") {
			frm.add_custom_button(__("Close"), function() {
				frm.set_value("status", "Closed");
				frm.save();
			});
		} else if (frm.doc.status !== "Linked") {
			frm.add_custom_button(__("Reopen"), function() {
				frm.set_value("status", "Open");
				frm.save();
			});
		}

		frm.add_custom_button(__("Relink"), function() {
			frm.trigger('show_relink_dialog');
		});
	},
	show_relink_dialog: function(frm){
		var lib = "frappe.email";
		var d = new frappe.ui.Dialog ({
			title: __("Relink Communication"),
			fields: [{
				"fieldtype": "Link",
				"options": "DocType",
				"label": __("Reference Doctype"),
				"fieldname": "reference_doctype",
				"get_query": function() {return {"query": "frappe.email.get_communication_doctype"}}
			},
			{
				"fieldtype": "Dynamic Link",
				"options": "reference_doctype",
				"label": __("Reference Name"),
				"fieldname": "reference_name"
			}]
		});
		d.set_value("reference_doctype", frm.doc.reference_doctype);
		d.set_value("reference_name", frm.doc.reference_name);
		d.set_primary_action(__("Relink"), function () {
			values = d.get_values();
			if (values) {
				frappe.confirm(
					__('Are you sure you want to relink this communication to {0}?', [values["reference_name"]]),
					function () {
						d.hide();
						frappe.call({
							method: "frappe.email.relink",
							args: {
								"name": frm.doc.name,
								"reference_doctype": values["reference_doctype"],
								"reference_name": values["reference_name"]
							},
							callback: function () {
								frm.refresh();
							}
						});
					},
					function () {
						show_alert('Document not Relinked')
					}
				);
			}
		});
		d.show();
	}

});
