using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace crystal_po_api.util
{
    public class InMemoryDestinationConfiguration : IDestinationConfiguration
    {
        Dictionary<string, RfcConfigParameters> availableDestinations;
        RfcDestinationManager.ConfigurationChangeHandler changeHandler;

        public InMemoryDestinationConfiguration()
        {
            availableDestinations = new Dictionary<string, RfcConfigParameters>();
        }

        public RfcConfigParameters GetParameters(string destinationName)
        {
            RfcConfigParameters foundDestination;
            availableDestinations.TryGetValue(destinationName, out foundDestination);
            return foundDestination;
        }

        //our configuration supports events
        public bool ChangeEventsSupported()
        {
            return true;
        }

        public event RfcDestinationManager.ConfigurationChangeHandler ConfigurationChanged
        {
            add
            {
                changeHandler = value;
            }
            remove
            {
                //do nothing
            }
        }

        public void changeLoginInfo(RfcConfigParameters p)
        {
            RfcConfigParameters existingConfiguration;
            //if a destination of that name existed before, we need to fire a change event
            if (availableDestinations.TryGetValue(p[RfcConfigParameters.Name], out existingConfiguration))
            {
                if (!p[RfcConfigParameters.User].Equals(existingConfiguration[RfcConfigParameters.User]) || !p[RfcConfigParameters.Password].Equals(existingConfiguration[RfcConfigParameters.Password]))
                {
                    RfcConfigParameters parameters = new RfcConfigParameters();
                    parameters[RfcConfigParameters.Name] = p[RfcConfigParameters.Name];
                    parameters[RfcConfigParameters.PeakConnectionsLimit] = existingConfiguration[RfcConfigParameters.PeakConnectionsLimit];
                    parameters[RfcConfigParameters.IdleTimeout] = existingConfiguration[RfcConfigParameters.IdleTimeout]; // we keep connections for 10 minutes
                    parameters[RfcConfigParameters.User] = p[RfcConfigParameters.User];
                    parameters[RfcConfigParameters.Password] = p[RfcConfigParameters.Password];
                    parameters[RfcConfigParameters.Client] = existingConfiguration[RfcConfigParameters.Client];
                    parameters[RfcConfigParameters.Language] = existingConfiguration[RfcConfigParameters.Language];
                    parameters[RfcConfigParameters.AppServerHost] = existingConfiguration[RfcConfigParameters.AppServerHost];
                    parameters[RfcConfigParameters.SystemNumber] = existingConfiguration[RfcConfigParameters.SystemNumber];
                    //parameters[RfcConfigParameters.MaxPoolWaitTime] = Convert.ToString(int.MaxValue);
                    availableDestinations[p[RfcConfigParameters.Name]] = parameters;
                    RfcConfigurationEventArgs eventArgs = new RfcConfigurationEventArgs(RfcConfigParameters.EventType.CHANGED, parameters);
                    Console.WriteLine("Fire change event " + eventArgs.ToString() + " for destination " + p[RfcConfigParameters.Name]);
                    changeHandler(p[RfcConfigParameters.Name], eventArgs);
                }
            }
            else
            {
                availableDestinations[p[RfcConfigParameters.Name]] = p;
            }
        }

        //allows adding or modifying a destination for a specific application server
        public void AddOrEditDestination(string name, int poolSize, string user, string password, string language, string client, string applicationServer, string systemNumber)
        {
            //in productive code the given parameters should be checked for validity, e.g. that name is not null
            //as this is not relevant for the example, we omit it here
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters[RfcConfigParameters.Name] = name;
            parameters[RfcConfigParameters.PeakConnectionsLimit] = Convert.ToString(poolSize);
            parameters[RfcConfigParameters.MaxPoolSize] = Convert.ToString(poolSize);
            parameters[RfcConfigParameters.IdleTimeout] = Convert.ToString(10); // we keep connections for 10 minutes
            parameters[RfcConfigParameters.User] = user;
            parameters[RfcConfigParameters.Password] = password;
            parameters[RfcConfigParameters.Client] = client;
            parameters[RfcConfigParameters.Language] = language;
            parameters[RfcConfigParameters.AppServerHost] = applicationServer;
            parameters[RfcConfigParameters.SystemNumber] = systemNumber;
            //parameters[RfcConfigParameters.MaxPoolWaitTime] = Convert.ToString(int.MaxValue);
            RfcConfigParameters existingConfiguration;
            //if a destination of that name existed before, we need to fire a change event
            if (availableDestinations.TryGetValue(name, out existingConfiguration))
            {
                availableDestinations[name] = parameters;
                RfcConfigurationEventArgs eventArgs = new RfcConfigurationEventArgs(RfcConfigParameters.EventType.CHANGED, parameters);
                Console.WriteLine("Fire change event " + eventArgs.ToString() + " for destination " + name);
                changeHandler(name, eventArgs);
                
            }
            else
            {
                availableDestinations[name] = parameters;
            }
            Console.WriteLine("Added application server destination " + name);
        }

        //allows adding or modifying a destination for a logon group of application servers
        //thus, a load balancing will be done
        public void AddOrEditDestination(string name, int poolSize, string user, string password, string language, string client, string messageServer, string systemID, string logonGroup)
        {
            //in productive code the given parameters should be checked for validity, e.g. that name is not null
            //as this is not relevant for the example, we omit it here
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters[RfcConfigParameters.Name] = name;
            parameters[RfcConfigParameters.PeakConnectionsLimit] = Convert.ToString(poolSize);
            parameters[RfcConfigParameters.IdleTimeout] = Convert.ToString(10); // we keep connections for 10 minutes
            parameters[RfcConfigParameters.User] = user;
            parameters[RfcConfigParameters.Password] = password;
            parameters[RfcConfigParameters.Client] = client;
            parameters[RfcConfigParameters.Language] = language;
            parameters[RfcConfigParameters.MessageServerHost] = messageServer;
            parameters[RfcConfigParameters.SystemID] = systemID;
            parameters[RfcConfigParameters.LogonGroup] = logonGroup;
            //parameters[RfcConfigParameters.MaxPoolWaitTime] = Convert.ToString(int.MaxValue);
            RfcConfigParameters existingConfiguration;
            //if a destination of that name existed before, we need to fire a change event
            if (availableDestinations.TryGetValue(name, out existingConfiguration))
            {
                availableDestinations[name] = parameters;
                RfcConfigurationEventArgs eventArgs = new RfcConfigurationEventArgs(RfcConfigParameters.EventType.CHANGED, parameters);
                Console.WriteLine("Fire change event " + eventArgs.ToString() + " for destination " + name);
                changeHandler(name, eventArgs);
            }
            else
            {
                availableDestinations[name] = parameters;
            }
            Console.WriteLine("Added load balancing destination " + name);
        }

        //removes the destination that is known under the given name
        public void RemoveDestination(string name)
        {
            if (name != null && availableDestinations.Remove(name))
            {
                Console.WriteLine("Successfully removed destination " + name);
                Console.WriteLine("Fire deletion event for destination " + name);
                changeHandler(name, new RfcConfigurationEventArgs(RfcConfigParameters.EventType.DELETED));
            }
        }

        //allows adjusting the pool size of existing destinations at runtime
        //if such a destination existed
        public bool AdjustPoolSize(string destinationName, int newPoolSize)
        {
            if (destinationName != null)
            {
                RfcConfigParameters existingConfiguration;
                //if a destination of that name exists, we can actually adjust it
                if (availableDestinations.TryGetValue(destinationName, out existingConfiguration))
                {
                    existingConfiguration[RfcConfigParameters.PeakConnectionsLimit] = Convert.ToString(newPoolSize);
                    RfcConfigurationEventArgs eventArgs = new RfcConfigurationEventArgs(RfcConfigParameters.EventType.CHANGED, existingConfiguration);
                    Console.WriteLine("Fire change event " + eventArgs.ToString() + " (poolsize adjusted) for destination " + destinationName);
                    changeHandler(destinationName, eventArgs);
                    return true;
                }
            }
            return false;
        }
    }

    public class CustomDestinationConfiguration
    {
        //in this example the management of the destination configurations is mixed with 'true' application code
        //for productive coding it is recommended to seperate such coding so that application coding is 
        //concentrating on application only
        public static void LocalMain()
        {
            InMemoryDestinationConfiguration myDestinationConfiguration = new InMemoryDestinationConfiguration();
            RfcDestinationManager.RegisterDestinationConfiguration(myDestinationConfiguration);
            Console.WriteLine("Registered own configuration");
            myDestinationConfiguration.AddOrEditDestination("Demo1", 5, "NCOTEST", "myPassWord", "DE", "000", "hostsys1", "53");
            myDestinationConfiguration.AddOrEditDestination("Demo2", 5, "NCOTEST", "myPassWord", "EN", "000", "hostsys1", "PRD", "PUBLIC");

            RfcDestination destination1 = RfcDestinationManager.GetDestination("Demo1");
            destination1.Ping();
            Console.WriteLine(destination1.SystemAttributes);
            RfcDestination destination2 = RfcDestinationManager.GetDestination("Demo2");
            destination2.Ping();
            Console.WriteLine(destination2.SystemAttributes);
            myDestinationConfiguration.AddOrEditDestination("Demo1", 5, "NCOTEST", "myPassWord", "EN", "000", "hostsys1", "53");
            myDestinationConfiguration.AdjustPoolSize("Demo2", 8);
            destination1 = RfcDestinationManager.GetDestination("Demo1");
            destination1.Ping();
            Console.WriteLine(destination1.SystemAttributes);
            myDestinationConfiguration.RemoveDestination("Demo2");
            try
            {
                destination2 = RfcDestinationManager.GetDestination("Demo2");
            }
            catch (RfcInvalidParameterException ipe)
            {
                Console.WriteLine("Caught expected exception: " + ipe.Message);
            }
            RfcDestinationManager.UnregisterDestinationConfiguration(myDestinationConfiguration);
            Console.WriteLine("Unregistered own configuration successfully");
        }
    }
}