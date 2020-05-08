using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;
using Newtonsoft.Json;
using System.Data;

namespace SOH_LaunchPad_Approval.soapproval.src
{
    public class DAO
    {
        public DataTable List(string userid)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_SO_DISPLAY");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("I_SODATA");
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

        public int GetCount(string userid)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_SO_DISPLAY");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("I_SODATA");

                return rtable.RowCount;
            }
            catch (Exception ex)
            {
                return 0;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        } 

        public DataTable Approve(string userid, List<SOApproveRst> rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_SO_APPROVE");
                rfcFunction.SetValue("I_BNAME", userid.ToUpper());

                IRfcTable rtable = rfcFunction.GetTable("TT_RSLT");
                foreach (var r in rst)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZSO_APPROVE").CreateStructure();
                    itemRow.SetValue("Vbeln", r.Vbeln);
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                rtable = rfcFunction.GetTable("TT_RSLT");
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
    }

    public class SOApproveRst
    {
        public string Vbeln;
        public string Zzbname;
        public string Zzbname2;
        public string Status;
        public string Message;

    }
}