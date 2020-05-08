using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;
using Newtonsoft.Json;
using System.Data;
using System.Reflection;
using System.Text.RegularExpressions;
using Helper;

namespace SOH_LaunchPad_Approval.pn.src
{
    public class DAO
    {
        public List<DataTable> List(string so, string vendor)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PN_DISPLAY");
                rfcFunction.SetValue("I_SO", so.ToUpper());
                rfcFunction.SetValue("I_VENDOR", vendor.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcStructure rs = rfcFunction.GetStructure("E_SO_PLAN_COST");
                var ds = SAPHelper.GetDataTableFromRfcStruct(rs);

                IRfcTable rtable = rfcFunction.GetTable("ET_PN_COST");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                List<DataTable> list = new List<DataTable>();
                list.Add(ds);
                list.Add(dt);

                return list;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public bool CheckReleaseAuth(string userid, string so, string vendor)
        {
            var rs = GetReleaseStrg(so, vendor);
            bool Check_1 = Common.CheckAccessByName(userid, "Approve_PN_Plant", rs.Plant);
            bool Check_2 = Common.CheckAccessByName(userid, "Approve_PN_ReleaseGroup", rs.ReleaseGp);
            bool Check_3 = Common.CheckAccessByName(userid, "Approve_PN_ReleaseCode", rs.ReleaseCode);

            return Check_1 & Check_2 & Check_3;
        }


        public ReleaseStrategy GetReleaseStrg(string so, string vendor)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PN_AUTHORITY_CHECK");
                rfcFunction.SetValue("I_SO", so.ToUpper());
                rfcFunction.SetValue("I_VENDOR", vendor.ToUpper());

                rfcFunction.Invoke(destination);
                var relGroup = rfcFunction.GetString("E_FRGGR");
                var werks = rfcFunction.GetString("E_WERKS");
                var sx = rfcFunction.GetString("E_FRGSX"); 
                var c = rfcFunction.GetString("E_MESSAGE");

                ReleaseStrategy rs = new ReleaseStrategy();
                rs.ReleaseGp.Add(relGroup);
                rs.ReleaseCode.Add(sx);
                rs.Plant.Add(werks);
                
                return rs;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }


        public DataTable Approve(string userid, PNApproveRst rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PN_RELEASE");
                rfcFunction.SetValue("I_SO", rst.SO.ToUpper());
                rfcFunction.SetValue("I_VENDOR", rst.Vendor.ToUpper());
                rfcFunction.SetValue("I_USERNAME", userid.ToUpper());

                IRfcTable rtable = rfcFunction.GetTable("IT_PN_SELECTED");
                foreach (var r in rst.PNReleased)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZPP_PN").CreateStructure();
                    itemRow.SetValue("PN", r.PN);
                    itemRow.SetValue("RELEASED", r.RELEASED);
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                rtable = rfcFunction.GetTable("ET_MESSAGE");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                return dt;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public class PNApproveRst
        {
            public string SO;
            public string Vendor;

            public List<PNApprovePNRel> PNReleased;

        }

        public class PNApprovePNRel
        {
            public string PN;
            public string RELEASED;
        }
    }
}