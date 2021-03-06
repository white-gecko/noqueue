import { Ticket, Minutes, AvailableSlot } from "../../service/domain";

type GenerateSlotsFromDataProps = {
  slots: Ticket[];
  duration: Minutes;
  from: Date;
};

export default function generateSlotsFromData({
  slots,
  duration,
  from,
}: GenerateSlotsFromDataProps): AvailableSlot[] {
  const durationInMs = duration * 60 * 1000;
  const mergedTicketsAsSlots: AvailableSlot[] = slots
    .filter((ticket) => {
      const ticketInPast = +ticket.end < +from;
      return !ticketInPast;
    })
    .map((ticket) => {
      if (+ticket.start < +from) {
        return { ...ticket, start: from };
      }
      return ticket;
    })
    .reduce<AvailableSlot[]>((acc, ticket) => {
      const hasAvailableSpot = ticket.reserved < ticket.allowed;
      if (!hasAvailableSpot) {
        return acc;
      }

      if (acc.length > 0) {
        const lastIndex = acc.length - 1;
        const lastTicket = acc[lastIndex];
        const canBeMerged = +lastTicket.end === +ticket.start;
        const mergedTicketOrTickets = canBeMerged
          ? [{ start: lastTicket.start, end: ticket.end }]
          : [lastTicket, ticket];
        return [...acc.slice(0, lastIndex), ...mergedTicketOrTickets];
      }
      return [ticket];
    }, []);
  const possibleTimeranges: AvailableSlot[] = mergedTicketsAsSlots.filter(
    (ticket) => {
      const ticketDuration = +ticket.end - +ticket.start;
      const timeIsEnough = durationInMs <= ticketDuration;
      return timeIsEnough;
    }
  );
  const splitInSlots: AvailableSlot[] = possibleTimeranges.flatMap((ticket) => {
    const firstSlot = +ticket.start;
    const lastSlot = +ticket.end - durationInMs;
    const fifteenMinutes = 15 * 60 * 1000;
    const howManySlots =
      1 + Math.floor((lastSlot - firstSlot) / fifteenMinutes);

    return new Array(howManySlots).fill(null).map((_, index) => {
      const start = new Date(firstSlot + fifteenMinutes * index);
      const end = new Date(+start + durationInMs);
      return { start, end };
    });
  });
  return splitInSlots;
}
