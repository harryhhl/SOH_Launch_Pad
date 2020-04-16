using crystal.dao;
using crystal.dto;
using crystal.util;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using SOH_LaunchPad_Approval.common;

namespace crystal_po_api.po.approval
{
    public partial class release_info : BasePOApprovalPage
    {
        public override RequestResult doRequest(object sender, EventArgs e)
        {
            //RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.getConfigParameter());
            //RfcDestination dest = ConfigUtil.getDestination();
            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            PODao dao = new PODao();
            ReleaseInfo d = dao.getPersonalReleaseInfo(dest, Request.Params["name"]);
            return RequestResult.Ok(d);
        }
    }
}