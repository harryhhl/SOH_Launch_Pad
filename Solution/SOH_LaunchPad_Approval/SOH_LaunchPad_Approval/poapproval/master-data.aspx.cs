using crystal.dao;
using crystal.dto;
using crystal.util;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using SOH_LaunchPad_Approval.common;


namespace crystal_po_api.po.approval
{
    public partial class master_data : BasePOApprovalPage
    {
        public override RequestResult doRequest(object sender, EventArgs e)
        {
            string skipVendorStr = Request.Params["skipVendor"];
            bool skipVendor = false;
            if (skipVendorStr != null)
            {
                skipVendor = bool.Parse(skipVendorStr);
            }
            skipVendor = true;

            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            POMasterDao dao = new POMasterDao();
            Dictionary<string, Object> d = new Dictionary<string, Object>();

            List<NameCodePair> companies = dao.getCompanyList(dest);
            d.Add("companies", companies);
            List<Condition> discounts = dao.getDiscountList(dest);
            d.Add("discounts", discounts);
            List<NameCodePair> incoterms = dao.getIncotermList(dest);
            d.Add("incoterms", incoterms);
            List<NameCodePair> paymentTerms = dao.getPaymentTermList(dest);
            d.Add("paymentTerms", paymentTerms);
            //List<NameCodePair> groups = dao.getPurchasingGroupList(dest);
            //List<NameCodePair> organizations = dao.getPurchasingOrganizationList(dest);
            if (!skipVendor)
            {
                List<Vendor> vendors = dao.getVendorList(dest, null, null, null, null, true);
                d.Add("vendors", vendors);
            }
            //List<Material> materials = dao.getMaterialList(dest, null);                        
            
            //d.Add("purchasingGroups", groups);
            //d.Add("purchasingOrganizations", organizations);
            
            //d.Add("materials", materials);


            return RequestResult.Ok(d);
        }
    }
}